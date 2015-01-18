Meteor.methods({
  fetchRecordings: function(songId) {
    return Recordings.find({songId: songId},
                           {fields: {_id: 0, songId: 0, userId: 0}, reactive: false}).fetch();
  }
});
