window.requestAnimationFrame = (function(){
return window.requestAnimationFrame  ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame    ||
  window.oRequestAnimationFrame      ||
  window.msRequestAnimationFrame     ||
  function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

window.rafID = null;
var audioContext = null;
var analyser = null;

function BufferLoader(context, arrayBuffers, callback) {
  this.context = context;
  this.arrayBuffers = arrayBuffers;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(arrayBuffer, index) {
  var loader = this;

  // Asynchronously decode the audio file data in request.response
  loader.context.decodeAudioData(
    arrayBuffer,
    function(buffer) {
      if (!buffer) {
        console.log('error decoding file data:');
        return;
      }
      loader.bufferList[index] = buffer;
      if (++loader.loadCount == loader.arrayBuffers.length) {
        loader.onload(loader.bufferList);
      }
    },
    function(error) {
      console.error('decodeAudioData error', error);
    }
  );
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.arrayBuffers.length; ++i)
  this.loadBuffer(this.arrayBuffers[i], i);
}

var playRecordings = function(err, recordings) {
  audioContext = new AudioContext(); // reinitialize that shit so hard
  analyser = audioContext.createAnalyser();
  var arrayBuffers = recordings.map(function(recording) {
    return recording.blob.file.buffer;
  });

  var playSound = function(time, buffer) {
    var source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser); // connect every source to the analyser
    source.start(time);
    window.sources.push(source);
  }

  // remix them tracks
  var finishedLoading = function(bufferList) {
    var SONG_LENGTH = 10; // seconds
    var OVERLAP = 0.1; // seconds
    bufferList.sort(function(a, b) {
      return a.duration < b.duration;
    });

    var longestBuffer = bufferList[0];
    if (!longestBuffer) {
      return;
    }

    // connect the analyser to the output
    analyser.connect(audioContext.destination);
    for (var time = 0; time < SONG_LENGTH; time += longestBuffer.duration - OVERLAP) {
      // play all the sounds to the longestBuffer beat
      bufferList.forEach(playSound.bind(this, time));
    }
  };

  var bufferLoader = new BufferLoader(audioContext, arrayBuffers, finishedLoading);
  bufferLoader.load();

  var canvas = document.getElementById('analyser');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var HEIGHT = canvas.height;
  var WIDTH = canvas.width;
  var drawContext = canvas.getContext('2d');

  var TALLEST = 200;

  var visualize = function() {
    var SPACING = 3;
    var BAR_WIDTH = 1;
    var numBars = Math.round(WIDTH / SPACING);
    var freqByteData = new Uint8Array(analyser.frequencyBinCount);

    analyser.getByteFrequencyData(freqByteData);

    drawContext.clearRect(0, 0, WIDTH, HEIGHT);
    drawContext.lineCap = 'round';
    var multiplier = analyser.frequencyBinCount / numBars;

    // Draw rectangle for each frequency bin.
    for (var i = 0; i < numBars; i++) {
      var magnitude = 0;
      var offset = Math.floor(i * multiplier);
      // gotta sum/average the block, or we miss narrow-bandwidth spikes
      for (var j = 0; j < multiplier; j++) {
        magnitude += freqByteData[offset + j];
      }
      magnitude = magnitude / multiplier;
      var normalize = (magnitude / TALLEST) * HEIGHT;
      drawContext.fillStyle = 'white';
      drawContext.fillRect(i * SPACING, HEIGHT, BAR_WIDTH, -normalize);
    }
    window.rafID = window.requestAnimationFrame(visualize);
  }
  window.rafID = window.requestAnimationFrame(visualize);

};

Template.song.rendered = function() {
  var now = Date.now();
  console.log('about to fetch recordings at ' + now);
  Meteor.call('fetchRecordings', this.data.songId, function(err, recordings) {
    var then = Date.now();
    console.log('fetched at ' + then);
    console.log(then - now);

    playRecordings(err, recordings);
  });
};
