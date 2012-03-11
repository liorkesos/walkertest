function getLoginStatus() {
	FB.getLoginStatus(function(response) {
		if (response.status == 'connected') {
			//alert('logged in');
		} else {
			alert('not logged in');
		}
	});
}

function me() {
	FB.api('/me/friends', function(response) {
		if (response.error) {
			//alert(JSON.stringify(response.error));
		} else {
			var data = document.getElementById('data');
			response.data.forEach(function(item) {
				var d = document.createElement('div');
				d.innerHTML = item.name;
				data.appendChild(d);
			});
		}
	});
}

function logout() {
	FB.logout(function(response) {
		//alert('logged out');
	});
}

function login() {
	FB.login(function(response) {
		if (response.session) {
			//alert('logged in');
			getSession();
		} else {
			//alert('not logged in');
		}
	}, {
		perms : "email"
	});
}