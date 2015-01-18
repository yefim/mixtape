window.AudioContext = window.AudioContext || window.webkitAudioContext;

Router.onBeforeAction(function() {
  Session.set('showSave'); // reset showSave
  Session.set('doneLoading'); // reset doneLoading
  window.sources || (window.sources = []);
  window.sources.forEach(function(source) {
    source.stop();
  });
  if (window.rafID) {
    window.cancelAnimationFrame(window.rafID);
    window.rafID = null;
  }
  if (!Meteor.userId()) {
    this.render('login');
  } else {
    this.next();
  }
});

Router.route('/', function() {
  this.render('home', {
    data: function() {
      return {songs: Songs.find()};
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
  var that = this;
  var songId = this.params._id;

  this.render('song', {
    data: function() {
      return {songId: songId, song: Songs.findOne({_id: songId})};
    }
  });
}, {name: 'song'});
