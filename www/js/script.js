var channel = null;
var client = new Faye.Client('http://api.swifto.com:8000/faye');
var wid = null;
var lastP = null;
var route = [];
var walkActive = false;
var pubInterval = null;
var timeInterval = null;
var events_array = [];
var walks = [];
var selectedWalk = null;
var startedWalk = null;
var selectedDog = null;
var walkDuration = null;
var walkFee = null;
var ONEMIN = 60000;
var ONESEC = 1000;
var SPEED = ONEMIN;
var SAMPLESIZE = 3;
var SAMPLEACCURACY = 100;
var MAXDISTANCEPERSECOND = 10;
var SAMPLEINTERVAL = 4000; //ms
var PUBLISHLOCATIONINTERVAL = 12000;

var firstLoad = true;
var samplePoints = [];
var samplerStarted = false;

//var swiffi = null;
//var db = null;

function sampleLocation() {	
	navigator.geolocation.getCurrentPosition(function (position) {

			var accuracy = position.coords.accuracy;
			var p = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			//	samplePoint(p, accuracy)
			samplePoint(p, accuracy);					
			if (!samplerStarted) { 				
				route.push(p);		
				samplerStarted = true;
			}		

		}, 
		function(e) {
			alert(e.message);
		}, 
		{		
			enableHighAccuracy : true
		}	   	                
    );		
}

function samplePoint(point, accuracy) {	
    if (samplePoints) {
	    var size = samplePoints.length;    
	}
    if (size < SAMPLESIZE)	{
    	if (accuracy < SAMPLEACCURACY) {
	    	 samplePoints.push({point:point, accuracy: accuracy});
	    }
    } else {    	
    	if (accuracy < SAMPLEACCURACY) {
    		 validatePoint(point);    	    	
	    	 samplePoints = [{point:point, accuracy: accuracy}];
	    }    	
    }
}

function validatePoint(point) {    
    var aveLat = 0;
    var aveLng = 0;    
    var distMult = (MAXDISTANCEPERSECOND*1000)/SAMPLEINTERVAL;
    var size = samplePoints.length;
    var valid = true;
    for (var index =0;index<size;index++) {    	
    	//not average done per point
  	  	aveLat = samplePoints[index].point.Ua;
  	  	aveLng = samplePoints[index].point.Va;

  	  	var distance = distanceBetweenTwoPoints({lat:aveLat,lng:aveLng},{lat:point.Ua,lng:point.Va});  	  	
  	  	if (distance > (size-index)*distMult) {
  	  		valid = false;
  	  	}
    }
	if (valid) {
		//now we will check the distance to the previous point
		var previous = route[route.length -1];		
		distance = distanceBetweenTwoPoints({lat:previous.Ua,lng:previous.Va},{lat:point.Ua,lng:point.Va});			
		if (distance < distMult) {
			route.push(point);			
		}
	  
	} 
}

function distanceBetweenTwoPoints(point1, point2) {
	//earth Radius
	var R = 6371; // km
	var lat1 = point1.lat;
	var lng1 = point1.lng;
	var lat2 = point2.lat;
	var lng2 = point2.lng;


	//delta lat in radians
	var dLat = degreesToRadians(lat2-lat1);
	var dLng = degreesToRadians(lng2-lng1);

	//latitude in radians
	lat1 = degreesToRadians(lat1);
	lat2 = degreesToRadians(lat2);

	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	        Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(lat1) * Math.cos(lat2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	var d = R * c;
	return d;
}

function degreesToRadians(degrees) {
	return ((degrees*Math.PI) / 180);
}

function onDeviceReady() {
	 /*db = createDB();
	 db.transaction(populateDB, errorCB, successCB);*/	 
	alert('You are so wrong - ios works!');
	// Connecting to our Facebook app
	FB.init({
		appId : "164604593617159",
		nativeInterface : PG.FB
	});
	
	samplePointInterval = setInterval(sampleLocation, SAMPLEINTERVAL);
	
	// Get our GPS location as we change position
	
	initSchedule();
	initWalkDetails();
	initDogDetails();
	initMap();
	initDirections();
}

function initSchedule() {
	$('#schedule').live('pageinit', function() {
		//alert(JSON.stringify(events_array));
		$("#calendar").dp_calendar({
			events_array: events_array,
			date_selected: new Date(), // i.e: new Date(2012,02,09)
			format_ampm: true,
			show_datepicker: false,
			show_sort_by: false
		}); 
		
		var activeChild = $("#calendar").dp_calendar.getDay();
		var slideNum = parseInt(activeChild / 7);
		var offsetNum = 308 * slideNum;
		if (offsetNum != 0) {
			$('ul#list_days', '#calendar').animate({
				'left': '-=' + offsetNum
			}, 1000);
		}
		showLoading('remove');
	});
	
	$('#schedule').live('pageshow', function() {
		if (startedWalk) {
			$('li#' + startedWalk, '#schedule').addClass('started');
		}
		else {
			$('li.started', '#schedule').removeClass('started');
		}
	});
}

function initWalkDetails() {
	$('#walk-details').live("pageshow", function() {
		// Hiding the Start Walk button if we already started another walk
		if (startedWalk && selectedWalk != startedWalk) {
		//	$('footer #start', '#walk-details').show();
			// showing it anyway untill we stabalize state
			startedWalkInfo = walks[startedWalk];
		//	startDate = new Date(startedWalkInfo.time.start);
			formattedStartDate = getLocalDate(startedWalkInfo.time.start);
		//	formattedStartDate = startDate.getHours() + ":" + startDate.getMinutes() + '-' + startDate.getDay() + '/' + startDate.getMonth();
			alert('Another walk is currently in progress: ' + formattedStartDate);
			alert('youll need to access it and let it finish');
			$('footer #start', '#walk-details').hide(); //LK
		}
		else {
			$('footer #start', '#walk-details').show();
		}
		/*else {
			$('footer #start', '#walk-details').html("Back to walk");
			$('footer #start', '#walk-details').show();
		}*/
		
		
		var currWalk = walks[selectedWalk];
		var owner = currWalk.participants.owner._id;
		//alert(JSON.stringify(owner.comms.phone.primary));
		
		// Prepare the page ui
		
		/* Handle the title */
		// Get the number of dogs
		var dogs = currWalk.participants.dogs._ids;
		if (dogs.length > 1) {
			// If we have a multiple dog walk we will write the number of dogs in the title
			$('#title', '#walk-details').html(dogs.length + ' DOGS');
		}
		else {
			$('#title', '#walk-details').html(dogs[0].name);
		}
		
		/* currently commenting out dog pic in single dog screen */
		/*
		var top = 65;
		for (var i=0; i<dogs.length; i++) {
			var dog = dogs[i];
			//dog.pic = 'images/default-dog-mobile.png';
			//$('#content', '#walk-details').append('<div id="'+ dog._id + '" class="dog-btn" style="background:url(' + dog.pic + ') no-repeat;top:' + top + 'px;"></div>');
			$('#content', '#walk-details').append('<div id="'+ dog._id + '" class="dog-btn"></div>');
			$('#content #' + dog._id, '#walk-details').css('top', top);
			top += 95;
		}
		*/

		$('#content .dog-btn', '#walk-details').live('click', function() {
			var dogID = $(this).attr('id');
			selectedDog = dogID;
			
			$.mobile.changePage( "#dog-details?id=" + dogID);
		});
		
		// Put the bg as the dogs pic
		var hdpic = 'http://flickholdr.com/320/400/dogs/10'; // TODO:Should be getting this from the dogs in the walk object
		$('#bg-holder', '#walk-details').attr('src', hdpic);
		
		// Put the owner name and location
		//$('#owner', '#walk-details').html(owner.firstName + ' ' + owner.lastName);
		$('#owner', '#walk-details').html(owner.username);

		var address = owner.location.staticLocation.original;			
		$('#location', '#walk-details').html(address);	
		
		// Put the owner cell number in the call action
		var cell = owner.comms.phone.primary;
		$('#content #call-wrapper', '#walk-details').attr('href', 'tel:' + cell);
		
		// Put the walk time
		var startDate = new Date(currWalk.time.start * 1000);
		//startDate.getTimezoneOffset("EST", true);

		var startTime = '';
		hours = startDate.getHours();
		minutes = startDate.getMinutes();
		if (hours > 12) {
			startTime = (hours < 10 ? '0':'') + hours - 12 + ":" + (minutes < 10 ? '0':'') + minutes + " PM";
		}
		else {
			startTime = (hours < 10 ? '0':'') + hours + ":" + (minutes < 10 ? '0':'') + minutes + " AM";
		} 
	
		$('#schedule', '#walk-details').html('Start Time - ' + startTime);
		
		
		// Mapping the buttons
		$('#content #route', '#walk-details').live('click', function() {
			// we reach here - button works.
			var p = route[route.length -1];			
			var currWalk = walks[selectedWalk];
			var owner = currWalk.participants.owner._id;			
			var ownerP = new google.maps.LatLng(owner.location.staticLocation.loc[0], owner.location.staticLocation.loc[1]);
			//var ownerP = new google.maps.LatLng(32.066574, 34.778337);
			/*alert(p);
			alert(ownerP);*/
			$('#dir_canvas').gmap('displayDirections', {					
				/*'origin': 'Netanya, Israel', 
				'destination': 'Tel Aviv, Israel',*/
				'origin': p, 
				'destination': ownerP,
				'travelMode': google.maps.DirectionsTravelMode.WALKING,					
			}, { 'panel': $('#directions-panel')[0]}, function(result, status) {
                if ( status === 'OK' ) {	                
                	//alert('Results found!');
                	$.mobile.changePage('#directions');
                	//result.bounds
                }
                else {
                	//alert(status);
                	alert("No directions found");
                }
			});
		});
		$('footer #start', '#walk-details').live('click', function() {
			var currWalk = walks[selectedWalk];
			
			$.mobile.changePage( "#map?id=" + selectedWalk);
		});
	});
}
function initDogDetails() {
	$('#dog-details').live("pageshow", function() {
		var currWalk = walks[selectedWalk];		
		var dogs = currWalk.participants.dogs._ids;
		for (var i=0; i<dogs.length; i++) {
			var dog = dogs[i];
			if (dog._id == selectedDog) {
				$('header #title', '#dog-details').html(dog.name);
				$('#type', '#dog-details').html(dog.breed);
				
				var dogDetails = dog.gender;
				if (dog.birthYear) {
					var d = new Date();
					var curr_year = d.getFullYear();
					var age = curr_year - dog.birthYear;
					dogDetails += ', ' + age + ' years old';
				}
				$('#age', '#dog-details').html(dogDetails);		
				$('p.description', '#dog-details').html(dog.additionalInfo);
				
				if (dog.features.notreats == true) {
					$('#warnings .strong-warning', '#dog-details').css('display', 'block');
					$('#actions .give-treats').css('display', 'none');
				} else {
					$('#warnings .strong-warning', '#dog-details').css('display', 'none');
				}
				if (dog.features.aggressive == true) {
					$('#warnings .warning', '#dog-details').css('display', 'block');
				} else {
					$('#warnings .warning', '#dog-details').css('display', 'none');
				}
				if (dog.features.friendly == true) {
					$('#actions .friendly', '#dog-details').css('display', 'block');
				}
				if (dog.features.pullleash == true) {
					$('#actions .pulls', '#dog-details').css('display', 'block');
				}
			}
		}
	});
}
function initMap() {	
	// Refresh the map on show to fix the breaking map problems
	var image = new google.maps.MarkerImage(
	  'marker-images/currentPosition-image.png',
	  new google.maps.Size(25,26),
	  new google.maps.Point(0,0),
	  new google.maps.Point(13,26)	 
	);

	$('#map').live("pagecreate", function() {
		var p = route[route.length -1];
		$('#map_canvas').gmap({ 'center' : p, 
	        'zoom' : 17, 
	        'mapTypeControl' : false, 
	        'navigationControl' : false,
	        'streetViewControl' : false,
	        'zoomControl': true,
	        'zoomControlOptions': {	           
			'position': google.maps.ControlPosition.LEFT_CENTER,				       
	        }
	      }).bind('init', function (ev, map) {	
	    	var p = route[route.length -1];
			$('#map_canvas').gmap('addMarker', { 'id': 'current', 'position': p, 'icon':image});
		});
		
		$('#complete-wrapper #submit', '#map').live('click', function() {
			// send the api the stop walk signal
			publish('stopWalk', {
				type: 'stopWalk',
				walkId: startedWalk,
				wid: wid
			});
			
			// on send clear the walk
			startedWalk = null;
			
			// reset the ui
			$('#complete-wrapper', '#map').css('display', 'none');
			$('#progress-slider-wrapper .fill', '#map').css('width', '0px');
			$('#progress-slider-wrapper .texture', '#map').css('width', '0px');			
			$('#progress-slider-wrapper .mold .text', '#map').html('0 Min WALKED');
			
			// reset the map
			$('#map_canvas').gmap('clear', 'markers');
			$('#map_canvas').gmap('clear', 'shapes');
			
			
			// go to the scheduled page
			$.mobile.changePage('#schedule');
		});
	});
	$('#map').live('pageshow', function() {
		
		if (startedWalk == null) {
			// We need to start the walk and send that to the api
			startedWalk = selectedWalk;

			// here we'll define walkDuration
			walkDuration = walks[startedWalk].duration / 60; //duration is recieved in seconds
			if (walks[startedWalk].money){
				walkFee = walks[startedWalk].money.fee.formatted
				// set the dynamic price
				$('#complete-content #money').html("You've just earned " + walkFee );
			}
			//set the dynamic duration
			$('#map .walk-duration').html(walkDuration + ' MIN WALK'); 
			
			// set active dog -single dog support
			//alert(JSON.stringify(walks[startedWalk].participants.dogs._ids[0]._id));
			selectedDog = walks[startedWalk].participants.dogs._ids[0]._id;
			$('footer #info', '#map').click(function() {
				$.mobile.changePage('#dog-details?id='+selectedDog);
			});

			// Publish our location every X seconds
			pubInterval = setInterval(publishLocation, PUBLISHLOCATIONINTERVAL);
			
			var pixls = parseFloat(225 / walkDuration);
			timeInterval = setInterval("timeAdvance(" + pixls + ");", SPEED);// every mi
			
			$('#map_canvas').gmap('refresh');

			
			publish('startWalk', {
				type:   'startWalk',
				walkId: startedWalk,
				wid: wid
			});
		}
		else {
			if (pubInterval == null) {
				// Publish our location every X seconds
				pubInterval = setInterval(publishLocation, PUBLISHLOCATIONINTERVAL);
			}
			if (timeInterval == null) {
				var pixls = parseFloat(225 / walkDuration);
				timeInterval = setInterval("timeAdvance(" + pixls + ");", SPEED); // every 1 minute
			}
		}
	});
}

function initDirections() {
	$('#directions').live('pagecreate', function() {
		var p = route[route.length -1];
		$('#dir_canvas').gmap({ 'center' : p }).bind('init', function(evt, map) {							
		});
	});
	$('#directions').live('pageshow', function() {
		$('#dir_canvas').height($(window).height() - $('header', '#directions').height());
		$('#dir_canvas').width($(window).width());
		$('#dir_canvas').gmap('refresh');
	});
}

function userLogin(email, password, session) {
	showLoading('start');
	showLoading('Loggin in');
	
	fbData = "";
	if (session) {
		var fbData = "&fbuid=" + session.uid + "fbtoken=" + session.access_token;
	}
	
	//testAPI('login');
	$.ajax({
		type : "GET",
		url : "https://api.swifto.com:7000/0.1/mobile/login/key/username=" + email + "&password=" + password + fbData,
		cache : false,
		dataType : "JSONP",
		success : function(data) {
			wid = data.id;
			
			// Clearing an old wid
			window.localStorage.clear();
			
			// Saving the new one in the localStorage
		    window.localStorage.setItem("wid", wid);
			
			if (data.success == false) {
				showLoading('remove');
				alert(data.errDesc);
				return;
			}
		
			if (channel) {		
				channel.cancel();
			}
			// Subscribe	
			channel = client.subscribe('/user/' + wid , function(data) {
				//alert('recieve ' + data.type);
				window[data.type].apply(window, [data]);	
			});
			
			// Publishing we are ready to receive stuff
			var type = 'ready';
			publish(type, {
				'type': type,
				'wid': wid
			});
		}
	});	
}

function getWalks(data) {	
  showLoading('Getting Walks');
	var date_selected = $("#calendar").dp_calendar.date_selected;

	events_array = new Array();
	walks = new Array();
	//alert(JSON.stringify(data));
	for (var i=0; i<data.walks.length; i++) {
		var walk = data.walks[i];
		//alert(JSON.stringify(walk));
		var owner = walk.participants.owner._id;
		//alert(JSON.stringify(owner));
		//alert(1);
		// Getting the walk general data
		var walkID = walk._id;
		//alert(walkID);
		var statusArr = walk.status.status; // WTF???		
		var currStatus = statusArr[statusArr.length - 1];
		//alert(currStatus);
		var startTime = walk.time.start;
		//alert(startTime);
		var endTime = walk.time.end; // Missing
		//alert(endTime);
		var currWalkLoc = '';
		if (owner.location) {
			currWalkLoc = owner.location.staticLocation.original;
		}
		
		//alert(currWalkLoc);
		
		walks[walkID] = walk;
		if (currStatus == 'started') {
			startedWalk = walkID;		
			walkDuration = walk.duration / 60; //duration is recieved in seconds			
	}
		
		//alert(3);
		//alert(JSON.stringify(currWalkLoc));
		
		// Get the participants data
		var dogName = walk.participants.dogs._ids[0].name;
		//alert(dogName);
		//var currWalk = [ new Date(startTime * 1000), dogName, currWalkLoc.lat + " " + currWalkLoc.lng, 1, [currStatus],  walkID];
		var currWalk = [ new Date(startTime * 1000), dogName, currWalkLoc, 1, [currStatus],  walkID];
		//alert(4);
		// Building the events array
		// events_array.push([ DATE, TITLE, DESCRIPTION, PRIORITY, STATUS_ARR ]);
		events_array.push(currWalk);
		//alert(JSON.stringify(events_array));
		//alert(5);
	}

	//can add condition to only do this if !firstLoad
	$("#calendar").dp_calendar({
			events_array: events_array,	
			date_selected: date_selected,
			format_ampm: true,
			show_datepicker: false,
			show_sort_by: false
	}); 
	
	//alert(JSON.stringify(events_array));
	//alert('after create events loop');
	if (firstLoad) {		
    showLoading('remove');
		$.mobile.changePage( "#schedule");
	} else {
		//alert("Your calender has been updated!");
	}

	firstLoad = false;
}

function getSession() {
	var session = FB.getSession();
	userLogin('test', '123', session);
}

function timeAdvance(pixls) {	
	$('#progress-slider-wrapper .fill', '#map').animate({
		width: '+=' + pixls + 'px'
	},'fast');
	
	$('#progress-slider-wrapper .texture', '#map').animate({
		width: '+=' + pixls + 'px'
	},'fast');
	
	var time_text = $('#progress-slider-wrapper .mold .text', '#map').html();
	time_text.replace(' Min WALKED', '');
	var time = parseInt(time_text) + 1;
	$('#progress-slider-wrapper .mold .text', '#map').html(time + ' Min WALKED');
	if (time == walkDuration) {
		//		
		// open the finish walk page
		finishWalk();
	}
}

function finishWalk() {
	clearInterval(timeInterval);
	timeInterval = null;
	
	clearInterval(pubInterval);
	pubInterval = null;
	
	// show the sms floating page
	$('#complete-wrapper', '#map').fadeIn();
}

function publishLocation(action) {
	var newP = route[route.length -1]; 
	if (!newP) {
		return;
	}
	
//	validatePoint(newP);

	var type = "addPoint";
	if (action) {
		type = action;
	}
	
	publish(type, {
		'type': type,
		'wid': wid,
		'did': selectedDog,
		'walkId': selectedWalk,
		'lat': newP.lat(),
		'lng': newP.lng(),
		'active': walkActive	
	});	
	
	// Put it on the map
	/*if (walkActive != true) {
		return;
	}*/
	
	//$('#map_canvas').gmap('clear', 'markers');
	
	// Moving the current Marker
	var currMarker = $('#map_canvas').gmap('get', 'markers')['current'];
	if (currMarker) {
		currMarker.setPosition(newP);		
		//currMarker.setMap(null);
	}
	else {
		// Adding it for the first time
	}
	
	if (action) {
		addActionMarker(newP, action);
	}
	
	if (lastP) {
		$('#map_canvas').gmap('addShape', 'Polyline', {
			//'did' : data.did,
			'path' : [ lastP, newP ],
			'strokeColor' : "#9fc151",
			'strokeOpacity' : 0.5,
			'strokeWeight' : 6,
			'fillColor' : "#9fc151",
			'fillOpacity' : 0.35
		});		
	}
	
	lastP = newP;
}

function addActionMarker(newP, action) {
	var image = new google.maps.MarkerImage(
	  'marker-images/' + action + '-image.png',
	  new google.maps.Size(32,52),
	  new google.maps.Point(0,0),
	  new google.maps.Point(16,52)
	);

	var shadow = new google.maps.MarkerImage(
	  'marker-images/' + action + '-shadow.png',
	  new google.maps.Size(62,52),
	  new google.maps.Point(0,0),
	  new google.maps.Point(16,52)
	);

	var shape = {
	  coord: [19,0,22,1,24,2,25,3,26,4,27,5,28,6,29,7,29,8,30,9,30,10,31,11,31,12,31,13,31,14,31,15,31,16,31,17,31,18,31,19,31,20,31,21,30,22,30,23,29,24,29,25,28,26,27,27,26,28,25,29,24,30,22,31,21,32,21,33,20,34,20,35,20,36,20,37,19,38,19,39,19,40,19,41,18,42,18,43,18,44,18,45,17,46,17,47,17,48,17,49,16,50,15,51,15,51,14,50,14,49,14,48,14,47,13,46,13,45,13,44,13,43,12,42,12,41,12,40,12,39,11,38,11,37,11,36,11,35,10,34,10,33,10,32,9,31,7,30,6,29,5,28,4,27,3,26,2,25,2,24,1,23,1,22,0,21,0,20,0,19,0,18,0,17,0,16,0,15,0,14,0,13,0,12,0,11,1,10,1,9,2,8,2,7,3,6,4,5,5,4,6,3,7,2,9,1,12,0,19,0],
	  type: 'poly'
	};

	var markerData = new google.maps.Marker({
	  id : action,
	  position : newP,
	  animation: google.maps.Animation.DROP,
	  icon: image,
	  shadow: shadow,
	  shape: shape
	});
	
	$('#map_canvas').gmap('addMarker', markerData);
}

function publish(type, jsonObj) {
	client.publish('/server/' + wid, jsonObj);
	//client.publish('/server/' + wid + '/' + type, jsonObj);
}

function populateDogs(data) {
	//var dogs = App.Dogs.create(); 

	if (!data.dogs || data.dogs.length <= 0) {
		//alert('getting out of populateDogs');
		return;
	}
	
	var d = null;
	for(var i=0; i<data.dogs.length; i++) {
		d = data.dogs[i];	

		//alert(JSON.stringify(d));
		//alert(JSON.stringify(d));
		/*var dog = App.Dog.create({
			'_id': d._id,
			'name': d.name,
			'pic': d.pic,
			'owner': d.owner
		});*/
		
		//alert(JSON.stringify(dog));
		
		var elm = $('<li id="' + d._id + '" class="item" style="background-image:url(\'' + d.pic + '\') no-repeat center;">' + d.name + '</li>');	
		$('#map footer #dogs .item-list').append(elm);
		
		/*dogs.append(dog);*/
	}
}

function findAddress(coords, callback) {
	var point = new google.maps.LatLng(coords[0], coords[1]);
	$('#map_canvas').gmap('search', {'location': point}, callback);
}

function exception(data) {
	alert(data.message);
	switch (data.errDesc) {
		case 'routeCreationFailure':
			$.mobile.changePage('#connect');
			break;
	}
}

function splash() {
	init();
	
	var savedWid = window.localStorage.getItem("wid");
	if (savedWid) {
		wid = savedWid;
		
		// Saving the new one in the localStorage
	    window.localStorage.setItem("wid", wid);
	    
		//setTimeout('$.mobile.changePage("#schedule");', '5000');
		setTimeout('$.mobile.changePage("#connect");', '1000');
	}
	else {
		setTimeout('$.mobile.changePage("#connect");', '1000');
	}
}

function init() {
	if (typeof PhoneGap == 'undefined')
		alert('PhoneGap variable does not exist. Check that you have included phonegap.js correctly');
	if (typeof PG == 'undefined')
		alert('PG variable does not exist. Check that you have included pg-plugin-fb-connect.js correctly');
	if (typeof FB == 'undefined')
		alert('FB variable does not exist. Check that you have included the Facebook JS SDK file.');

	FB.Event.subscribe('auth.login', function(response) {
		//alert('auth.login event');
	});

	FB.Event.subscribe('auth.logout', function(response) {
		//alert('auth.logout event');
	});

	FB.Event.subscribe('auth.sessionChange', function(response) {
		//alert('auth.sessionChange event');
	});

	FB.Event.subscribe('auth.statusChange', function(response) {
		//alert('auth.statusChange event');
	});

	document.addEventListener("deviceready", onDeviceReady, false);
	// onDeviceReady();
}



function showLoading(msg) {
	if (msg == 'remove') {
		//swiffi.stop();
//		$('#loading').remove();
		$('#overlay').remove();
		$('#status').remove();
	}
	else if (msg == 'start'){ 
		if ($('#loading-overlay').length == 0) {
			/*$('', '#connect').attr('disabled', 'disabled');*/
			$('body').append($('<div id="overlay"></div>'));
			$('body').append($('<div id="status">' + msg +'</div>'));
			/*swiffi = new swiffy.Stage($('#loading')[0], swiffyobject);
			swiffi.start();*/
		}
  }
	else {
      //various status updates
    $('#status').html(msg);
	  //swiffi.start();
	}
}

function testAPI(type) {
	$.ajax({
		type : "GET",
		url : "https://api.goworkit.com:7000/0.1/mobile/test/key/type=" + type,
		cache : false,
		dataType : "JSON",
		success : function(data) {
		}
	});
}

/*function formatTime (unixtime) {
 
  var date = new Date(unixtime*1000);
  // hours part from the timestamp
  var hours = date.getHours();
  // minutes part from the timestamp
  var minutes = date.getMinutes();
  // seconds part from the timestamp
  var seconds = date.getSeconds();

  var day = date.getDay();

  var month = date.getMonth();

  // will display time in 10:30:23 format
  var ampm = "am";
  if (hours>=12) {
    hours = hours-12;
    ampm = "pm";
  }
  var formattedTime = hours + ':' + minutes + " "+ampm;
  
  return formattedTime;

}*/

function getLocalDate(timestamp)
{
  var months = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
  var dt = new Date(timestamp * 1000);
  var month = months[dt.getMonth()];
  return dt.getDate() + "-" + month + " "+ formatTime(dt.getHours(), dt.getMinutes());
}

function formatTime(hours, minutes){
 // will display time in 10:05 am format
  var ampm = "am";
  if (hours>=12) {
    hours = hours-12;
    ampm = "pm";
  }

 var extrazero = ['',''];
 if (minutes <10) { 
   extrazero[0] = '0';
 }
 
var formattedTime = hours + ':' + extrazero[0]+minutes + " "+ampm;
 return formattedTime;
}
