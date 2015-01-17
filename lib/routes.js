Router.onBeforeAction(function() {
  if (!Meteor.userId()) {
    this.render('login');
  } else {
    this.next();
  }
});

Router.route('/', function() {
  this.render('home', {
    data: function() {
      var recordings = Recordings.find({userId: Meteor.userId()});
      var recordingsHash = {};
      recordings.forEach(function(recording) {
        recordingsHash[recording.songId] = true;
      });
      var data = {
        songs: Songs.find(),
        recordingsHash: recordingsHash
      };
      return data;
    }
  });
}, {name: 'home'});

Router.route('/create', function() {
  this.render('create');
});

Router.route('/record/:_id', function() {
  var songId = this.params._id;
  this.render('record', {
    data: function() {
      return {songId: songId};
    }
  });
}, {name: 'record'});

Router.route('/song/:_id', function() {
  var songId = this.params._id;
  this.render('song', {
    data: function() {
      var data = {
        song: Songs.findOne({_id: songId}),
        recordings: Recordings.find({songId: songId})
      }
      return data;
    }
  });
}, {name: 'song'});
