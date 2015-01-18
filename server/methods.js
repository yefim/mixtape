Meteor.methods({
  fetchRecordings: function(songId) {
    return Recordings.find({songId: songId}).fetch();
  }
});
