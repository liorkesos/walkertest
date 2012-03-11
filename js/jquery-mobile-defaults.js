$(document).bind("mobileinit", function() {
	$.extend( $.mobile , {
		defaultTransition : "flip",
		loadingMessage : "Please Wait...",
		domain : 'http://api.swifto.com/',
		gradeA: function() {
			// Our application should only work in browsers that support
			// CSS transitions.
			var div = document.createElement('div');
			div.innerHTML = '<div style="-webkit-transition:color 1s linear; -moz-transition:color 1s linear;"></div>';
			var cssTransitionsSupported = false;
			cssTransitionsSupported =
				(div.firstChild.style.webkitTransition !== undefined) ||
				(div.firstChild.style.MozTransition !== undefined);
			return cssTransitionsSupported;
		}
	});
});