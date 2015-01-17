Template.song.helpers({
  src: function(blob) {
    var song = new Blob([blob.file], {type: blob.type});
    return URL.createObjectURL(song);
  }
});
