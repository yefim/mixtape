var audioContext = null;

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
  }

  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }

  request.send();
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
  this.loadBuffer(this.urlList[i], i);
}

window.AudioContext = window.AudioContext || window.webkitAudioContext;

Template.song.rendered = function() {
  audioContext = new AudioContext(); // reinitialize that shit so hard
  var recordingUrls = this.data.recordings.map(function(recording) {
    var blob = recording.blob;
    var song = new Blob([blob.file], {type: blob.type});
    return URL.createObjectURL(song);
  });

  var playSound = function(buffer, time) {
    var source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(time);
    console.log(time);
  }

  // remix them tracks
  var finishedLoading = function(bufferList) {
    var sortedBuffers = bufferList.sort(function(a, b) {
      return a.duration < b.duration;
    });
    var tracks = 0;
    for (var i = 0; i < 6; i+=2) {
      var buffer = sortedBuffers[tracks];
      playSound(buffer, i);
      tracks = (tracks + 1) % sortedBuffers.length;
    }
  };

  var bufferLoader = new BufferLoader(audioContext, recordingUrls, finishedLoading);
  bufferLoader.load();
};
