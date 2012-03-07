window.App = Ember.Application.create();

window.App.Dog = Ember.Object.extend({
	// these will be supplied by `create`
	'_id': null,
	'name': null,
	'pic': null,
	'owner': null,
	
	bark: function(thing) {
		alert("I'm " + this.get('name') + " the son of " + this.get('owner') + " and I approve this message -> wooof");
	},
	poop: function(thing) {
		alert(thing);
	},
	hangout: function(thing) {
		alert(thing);
	}
});

window.App.Dogs = Ember.Object.extend({
	'tag': 'my',
	'dogs': new Array(),
	
	append: function(dog) {
		var dogs = this.get('dogs');
		dogs.push(dog);
		this.set('dogs', dogs);
	}
});

window.App.Route = Ember.Object.extend({
	// these will be supplied by `create`
	started: true,
	participants: {
		owner:null, 
		walker:null, 
		dog: new Array()
	},
    location: new Array(),

    start: function(thing) {
		alert(thing);
	},
    
	stop: function(thing) {
		alert(thing);
	}
});