Meteor.methods({
  fetchRecordings: (songId) => {
    const recordings = Recordings.find(
      {songId},
      {
        fields: {_id: 0, songId: 0, userId: 0},
        reactive: false
      }
    ).fetch();

    return recordings;
  }
});
