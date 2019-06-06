var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}};

var storage = (function() {
	"use strict";
	return {
		encode: function(data = false) {
			if(data) {
				var type = typeof data;
				if(type === 'string' || type === 'number') {
					return data;
				} else {
					return JSON.stringify(data);
				}
			} else {
				return false;
			}
		},
		decode: function(data = false) {
			if(data) {
				try {
					return JSON.parse(data);
				} catch (e) {
					return data;
				}
			} else {
				return false;
			}
		},
		get: function(name = false) {
			if(name) {
				var data = localStorage.getItem(name);
				return storage().decode(data);
			} else {
				return false;
			}
		},
		set: function(name = false, data = false) {
			if(name && data) {
				localStorage.setItem(name, storage().encode(data));
				return true;
			}
		},
		delete: function(name = false) {
			if (name){
				localStorage.removeItem(name);
			}
		}
	}
});
// submit form
$('#main-login form').on('submit', function(e) {
	var credentials = storage().get('crewtoken');
	e.preventDefault();
	$.ajax({
			url: 'https://bigg.global/oauth/token',
			type: 'POST',
			data: $(this).serialize(),
			beforeSend: function(xhr) {
				xhr.setRequestHeader('Authorization', 'Basic ' + Base64.encode('CZ6ZbiG2h2Or0N40ByT4s6VbKYB3PP6rPcq1u73M:9RdaFhahQ3ljahvVf6Y4W4vLgWML4QxeILon3zEU'));
			}
		})
		.done(function(data) {
			data.date = moment().toISOString();
			data.tokenValidUntil = moment().add(data.expires_in, 's').toISOString();
			data.refreshTokenValidUntil = moment().add(604800, 's').toISOString();
			storage().set('crewtoken', data);
			app.loginScreen.get('#main-login').close();
			app.views.main.router.navigate({ name: 'home' });

			$.get('https://bigg.global/oauth/me/?access_token=' + data.access_token, function(response) {
				storage().set('userName', response.display_name);
			});
		})
		.catch(function(error) {
			console.log(error);
		});
});
$('.open-password').on('click', function() {
	app.dialog.password('Ingrese nueva Contraseña', function(password) {
		var credentials = storage().get('crewtoken');
		$.ajax({
			url: 'https://bigg.global/oauth/me/?access_token=' + credentials.access_token,
			type: 'GET',

		}).done(function(data) {
			app.dialog.alert('Su Contraseña ha sido cambiada con exito');

		});
	});
});

function checkToken(routeTo, routeFrom, resolve, reject) {
	var screen = app.loginScreen.create({ el: '#main-login' });
	var credentials = storage().get('crewtoken');
	if(credentials && credentials.access_token) {
		// If token is valid
		if(moment().isBefore(credentials.tokenValidUntil)) {
			if(routeTo) resolve(routeTo);
		} else if(moment().isBefore(credentials.refreshTokenValidUntil)) {
			// If refresh token is valid
			$.ajax({
					url: 'https://bigg.global/oauth/token',
					type: 'POST',
					data: {
						'grant_type': 'refresh_token',
						'refresh_token': credentials.refresh_token
					},
					beforeSend: function(xhr) {
						xhr.setRequestHeader('Authorization', 'Basic ' + Base64.encode('CZ6ZbiG2h2Or0N40ByT4s6VbKYB3PP6rPcq1u73M:9RdaFhahQ3ljahvVf6Y4W4vLgWML4QxeILon3zEU'));
					}
				})
				.done(function(data) {
					data.date = moment().toISOString();
					data.tokenValidUntil = moment().add(data.expires_in, 's').toISOString();
					data.refreshTokenValidUntil = moment().add(604800, 's').toISOString();
					storage().set('crewtoken', data);
					$.get('https://bigg.global/oauth/me/?access_token=' + data.access_token, function(response) {
						console.log(response);
					});
				});
		} else {
			screen.open();
		}
	} else {
		screen.open();
	}
}
