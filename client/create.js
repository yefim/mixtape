Template.create.events({
  'submit .create': (e) => {
    e.preventDefault();

    const name = e.target.name.value;
    const songId = Songs.insert({name: name});

    Router.go('record', {_id: songId});
  }
});
