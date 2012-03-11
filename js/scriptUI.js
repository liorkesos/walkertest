//var chosenDog;
$(document).ready(function() {

	/* global */
	
	/*$('section').live('pagecreate', function() {		
		$('#menu-title', 'footer').click(function() {
			if (!$(this).hasClass('open')) {
				$('#menu-body', 'footer').show();
				$(this).addClass('open');
			}
			else {
				$('#menu-body', 'footer').hide();
				$(this).removeClass('open');
			}
		});
	
		$('#menu-body li', 'footer').click(function() {		
			$('ul.item-list', 'footer #menu-body').children('.selected').removeClass('selected');
			$(this).addClass('selected');
		});
	});
	*/
	//document.addEventListener("backbutton", onBackKeyDown, true);

	
	$('#connect').live('pagecreate', function() {
		$('input', '#connect').bind('focus', function() {
			$('#footer', '#connect').hide();
		});
		$('input', '#connect').bind('blur', function () {
			$('#footer', '#connect').show();
		});
	});
	
	$('#map').live('pagecreate', function() {
		$('#action-poo', '#map').click(function() {
			publishLocation('addPoop');
		});
		$('#action-friend', '#map').click(function() {
			publishLocation('addMeet');
		});
		$('#reset', '#map').click(function() {
			publish('restartWalk', {
				type: 'restartWalk',
				walkId: selectedWalk
			});
			
			// reset the ui
			$('#progress-slider-wrapper .fill', '#map').animate({
				'width': '0px',
			}, 'fast');
			
			$('#progress-slider-wrapper .texture', '#map').animate({
				'width': '0px',
			}, 'fast');
			
			$('#progress-slider-wrapper .mold .text', '#map').html('0 Min WALKED');
			
			// reset the map
			$('#map_canvas').gmap('clear', 'markers');
			$('#map_canvas').gmap('clear', 'shapes');
		});
		
		$('textarea', '#map').bind('focus', function() {
			$('footer', '#map').hide();
			$('header', '#map').hide();
			$('#complete-wrapper ', '#map').animate({
				top: '5px'
			}, 'fast');
		});
		$('textarea', '#map').bind('blur', function() {
			$('footer', '#map').show();
			$('header', '#map').show();
			$('#complete-wrapper ', '#map').animate({
				top: '100px'
			}, 'fast');
		});
		
	});
	$('#schedule').live('pagecreate', function() {
		$('ul#list_days', '#calendar').live('swipeleft', function() {
			/*alert('swipeleft');
			alert($(this).position().left -300);*/
			if ($(this).position().left -308 < -1232) {		
				return false;
			}
			
			$(this).animate({
				'left': '-=308'
			}, function() {
				//alert($('ul#list_days', '#calendar').position().left);
			});
		});
		$('ul#list_days', '#calendar').live('swiperight', function() {
			/*alert('swiperight');*/
			if ($(this).position().left +308 > 0) {		
				return false;
			}

			$(this).animate({
				'left': '+=308'
			}, function() {
				//alert($('ul#list_days', '#calendar').position().left);
			});
		});
		$('#calendar #list li').live('click', function() {
			var walkID = $(this).attr('id');
			selectedWalk =  walkID;
			
			if (selectedWalk == startedWalk) {
				$.mobile.changePage("#map");
			}
			else {
				$.mobile.changePage("#walk-details?id=" + walkID);	
			}
		});
	});
	

$('#connect #login').live('touchstart', function() {
	var email = $('#connect #email').val();
	var password = $('#connect #password').val();
	userLogin(email, password);
});



/*$('#dogs-btn').live('click', function() {
	$('#dogs').fadeToggle("fast");
});
$('#settings-btn').live('click', function() {
	$('#settings').fadeToggle("fast");
});

 Settings 
$('.logout', '#settings').live('click', function() {
	$('#settings').fadeToggle("false");
	
	var type = 'unsubscribe';
	publish(type, {
		'type': type,
		'wid': wid
	});
	wid = null;
	clearInterval(interval);
    interval = null;
	$.mobile.changePage("#connect", {'reverse': true});
});

 Dogs 
$('.item', '#dogs').live('click', function() {
	var id = $(this).attr('id');
	var name = $(this).html();
	chosenDog = id;
	
	// Close the dogs screen
	$('#dogs').fadeToggle("fast");
	
	$(this).addClass('.selected');
	
	// Writing a message
	$('#messages').html('You Chose ' + name);
	$('#messages').animate({
		'top' : '+=104'		
	}, 700).delay(2000).animate({
		'top' : '-=104'
	}, 700);
	
	
	// Showing the dog button
	$('#chosen').html(name);
	$('#chosen').animate({
		'bottom' : '+=74'		
	}, 700).delay(1000).animate({
		'opacity' : '.5'
	}, 700);
});
*/
/* Actions */

// Manage the active
/*$('.start', '#actions').live("click", function(event, ui) {
	$('#actions').fadeToggle("fast");
	
	if ($('.start', '#actions').html() == 'start'){
		$('.start', '#actions').html('stop');
	}
	else {
		$('.start', '#actions').html('start');
	}
	
	if (walkActive == true) {
		// We should publish "stop"
		walkActive = false;
		$('#messages').html('Stopped Walking');
	} 
	else {			
		// We should publish "start"
		walkActive = true;
		$('#messages').html('Started Walking');
	}
	
	$('#messages').animate({
		'top' : '+=104'		
	}, 700).delay(2000).animate({
		'top' : '-=104'
	}, 700);		
});*/

/* Footer */
/*$('#chosen', '#map footer').live('click', function() {
	$('#actions').fadeToggle("fast");
});*/
});
function onBackKeyDown() {
    	// Handle the back button
    //	alert($("section").attr("id"));
    //	$('#footer', '#connect').show();

}
