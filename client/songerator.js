var audioRecorder = null;
var audioFile = null;

var initAudio = function() {
  if (!navigator.getUserMedia) {
    navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  }

  navigator.getUserMedia(
    {
      "audio": {
        "mandatory": {
          "googEchoCancellation": "false",
          "googAutoGainControl": "false",
          "googNoiseSuppression": "false",
          "googHighpassFilter": "false"
        },
        "optional": []
      },
    }, gotStream, function(e) {
      console.log(e);
    }
  );
};

var gotStream = function(stream) {
  var inputPoint = window.audioContext.createGain();

  // Create an AudioNode from the stream.
  var realAudioInput = window.audioContext.createMediaStreamSource(stream);
  var audioInput = realAudioInput;
  audioInput.connect(inputPoint);

  var analyserNode = window.audioContext.createAnalyser();
  analyserNode.fftSize = 2048;
  inputPoint.connect(analyserNode);

  audioRecorder = new Recorder(inputPoint);

  var zeroGain = window.audioContext.createGain();
  zeroGain.gain.value = 0.0;
  inputPoint.connect(zeroGain);
  zeroGain.connect(window.audioContext.destination);
}

var BinaryFileReader = {
  read: function(file, callback) {
    var reader = new FileReader();

    var fileInfo = {
      name: file.name,
      type: file.type,
      size: file.size,
      file: null
    };

    reader.onload = function() {
      fileInfo.file = new Uint8Array(reader.result);
      callback(null, fileInfo);
    }

    reader.onerror = function() {
      callback(reader.error);
    }

    reader.readAsArrayBuffer(file);
  }
}

Template.record.rendered = initAudio;

var playSound = function(buffer) {
  var source = window.audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(window.audioContext.destination);
  source.start(0);
  window.sources.push(source);
}

Template.record.events({
  'click .record-button': function() {
    _.invoke(window.sources, 'stop');
    window.sources = [];
    if (audioRecorder) {
      audioRecorder.record();
      Session.set('isRecording', true);
    } else {
      // should check if prompt exists already
    }
  },
  'click .stop-button': function() {
    Session.set('showSave', true);
    audioRecorder.stop();
    audioRecorder.exportWAV(function(blob) {
      Session.set('isRecording', false);
      BinaryFileReader.read(blob, function(err, fileInfo) {
        audioFile = fileInfo;

        window.audioContext.decodeAudioData(audioFile.file.buffer,
          function(buffer) {
            if (!buffer) {
              console.log('error decoding');
            }
            playSound(buffer);
          },
          function(err) {
            console.error(err);
          }
        );

        audioRecorder.clear();
      });
    });
  },
  'submit .record': function(e) {
    e.preventDefault();
    if (!audioFile) {
      return;
    }
    var songId = e.target.songId.value;
    e.target.add.disabled = true; // disable Add button
    Recordings.insert({songId: songId, userId: Meteor.userId(), blob: audioFile});
    Router.go('song', {_id: songId});
  }
});

Template.record.helpers({
  isRecording: function() {
    return Session.get('isRecording');
  },
  showSave: function() {
    return Session.get('showSave');
  }
});

Meteor.Spinner.options = {
  lines: 13, // The number of lines to draw
  length: 10, // The length of each line
  width: 5, // The line thickness
  radius: 15, // The radius of the inner circle
  corners: 0.7, // Corner roundness (0..1)
  rotate: 0, // The rotation offset
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: '#8cd867', // #rgb or #rrggbb
  speed: 1, // Rounds per second
  trail: 60, // Afterglow percentage
  shadow: true, // Whether to render a shadow
  className: 'spinner', // The CSS class to assign to the spinner
};
