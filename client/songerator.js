window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = audioContext || new AudioContext();
var audioRecorder = null;
var audioBlob = null;

var startRecording = function() {
  if (!navigator.getUserMedia) {
    navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  }
  if (!navigator.cancelAnimationFrame) {
    navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
  }
  if (!navigator.requestAnimationFrame) {
    navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;
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
  zeroGain.connect( audioContext.destination );

  audioRecorder.record();
  Session.set('isRecording', true);
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

Template.record.events({
  'click .record-button': function() {
    startRecording();
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
      BinaryFileReader.read(audioBlob, function(err, fileInfo) {
        Recordings.insert({songId: songId, userId: Meteor.userId(), blob: fileInfo});
        Router.go('home');
      });
    }
  }
});

Template.record.helpers({
  isRecording: function() {
    return Session.get('isRecording');
  }
});
