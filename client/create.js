Template.create.events({
  'submit .create': function(e) {
    e.preventDefault();
    var name = e.target.name.value;
    var songId = Songs.insert({name: name});
    Router.go('record', {_id: songId});
  }
});
