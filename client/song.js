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

var audioContext = audioContext || new AudioContext();

Template.song.helpers({
  src: function(blob) {
    var song = new Blob([blob.file], {type: blob.type});
    return URL.createObjectURL(song);
  }
});

Template.song.rendered = function() {
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
  }

  // remix them tracks
  var finishedLoading = function(bufferList) {
    var tracks = 0;
    for (var i = 0; i < 20; i+=2) {
      var buffer = bufferList[tracks];
      console.log(buffer);
      playSound(buffer, i);
      tracks = (tracks + 1) % bufferList.length;
    }
  };

  var bufferLoader =  new BufferLoader(audioContext, recordingUrls, finishedLoading);
  bufferLoader.load();
  console.log(recordingUrls);
};
