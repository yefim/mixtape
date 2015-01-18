window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = audioContext || new AudioContext();
var audioRecorder = null;
var audioBlob = null;

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
      alert('Error getting audio');
      console.log(e);
    }
  );
};

var gotStream = function(stream) {
  var inputPoint = audioContext.createGain();

  // Create an AudioNode from the stream.
  var realAudioInput = audioContext.createMediaStreamSource(stream);
  var audioInput = realAudioInput;
  audioInput.connect(inputPoint);

  var analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 2048;
  inputPoint.connect(analyserNode);

  audioRecorder = new Recorder(inputPoint);

  var zeroGain = audioContext.createGain();
  zeroGain.gain.value = 0.0;
  inputPoint.connect(zeroGain);
  zeroGain.connect(audioContext.destination);
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

Template.record.events({
  'click .record-button': function() {
    audioRecorder.record();
    Session.set('isRecording', true);
  },
  'click .stop-button': function() {
    audioRecorder.stop();
    audioRecorder.exportWAV(function(blob) {
      audioBlob = blob;
      var url = URL.createObjectURL(audioBlob);
      var au = document.createElement('audio');
      au.controls = true;
      au.src = url;
      document.querySelector('.record').appendChild(au);

      Session.set('isRecording', false);
    });
  },
  'submit .record': function(e) {
    e.preventDefault();
    if (audioBlob) {
      var songId = e.target.songId.value;
      console.log('about to read audioBlob');
      BinaryFileReader.read(audioBlob, function(err, fileInfo) {
        console.log('about to insert');
        Recordings.insert({songId: songId, userId: Meteor.userId(), blob: fileInfo});
        console.log('about to redirect');
        Router.go('song', {_id: songId});
      });
    }
  }
});

Template.record.helpers({
  isRecording: function() {
    return Session.get('isRecording');
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
