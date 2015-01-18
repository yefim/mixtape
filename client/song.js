var audioContext = null;

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
  var arrayBuffers = recordings.map(function(recording) {
    return recording.blob.file.buffer;
  });

  var playSound = function(time, buffer) {
    var source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
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

    for (var time = 0; time < SONG_LENGTH; time += longestBuffer.duration - OVERLAP) {
      // play all the sounds to the longestBuffer beat
      bufferList.forEach(playSound.bind(this, time));
    }
  };

  var bufferLoader = new BufferLoader(audioContext, arrayBuffers, finishedLoading);
  bufferLoader.load();
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
