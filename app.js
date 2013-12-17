
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var request = require('request');
var app = express();
var async = require('async');
var passport = require('passport')
	, FacebookStrategy = require('passport-facebook').Strategy;
var facebookChat = require("facebook-chat");
var facebookAppId = '';
var facebookSecretKey = '';
var friendListUrl = "https://graph.facebook.com/me/friends?fields=id,name,username&access_token=";

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.session({ secret: 'keyboard cat' }));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);

	passport.use(new FacebookStrategy({
		clientID: process.env.FACEBOOK_APP_ID || facebookAppId,
		clientSecret: process.env.FACEBOOK_APP_SECRET || facebookSecretKey,
		callbackURL: "http://hp.discome.com:3000/auth/facebook/callback"
	},
	function(accessToken, refreshToken, profile, done) {
		getFacebookFriends(accessToken, function (err, friends) {
			console.log(err, friends);
			usersFriends[profile.id] = friends;
			itsgotime(profile, friends);
		done(null, profile);
		});
	}
));

var users = {};
var usersAccessTokens = {};
var usersFriends = {};
app.get('/', routes.index);
app.get('/users', user.list);

// Redirect the user to Facebook for authentication.	When complete,
// Facebook will redirect the user back to the application at
//		/auth/facebook/callback
app.get('/auth/facebook',
	passport.authenticate('facebook', {
	scope: ['email', 'offline_access', 'friends_about_me', 'xmpp_login']
	})
);

// Facebook will redirect the user to this URL after approval.	Finish the
// authentication process by attempting to obtain an access token.	If
// access was granted, the user will be logged in.	Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback', 
	passport.authenticate('facebook', {
		successRedirect: '/',
		failureRedirect: '/login'
	})
);
passport.serializeUser(function(user, done) {
	console.log("serialize", user);
	users[user.id] = user;
 	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	console.log("deserialize", users[id]);
	done(null, users[id]);
});

var getFacebookFriends = function(accessToken, cb) {
	request({url: friendListUrl+accessToken, json:true}, function(err, res, body) {
		if (!err) {
			cb(null, body);
		} else {
			cb(err);
		}
	});
};

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

var itsgotime = function (profile, friends) {

}

var connections = {};
var sendMessage = function (senderid, receiverid, accessToken, message, cb) {
	var params = {
		facebookId : senderid,
		secret_key : facebookSecretKey,
		appId : facebookAppId,
		accessToken : accessToken
	};
	if (!connections[senderid]) {
		var facebookClient = new facebookChat(params);
		connections[senderid] = {ready: false, client: facebookClient};
		facebookClient.on('online', function () {
			console.log("ONLINE!", senderid);
			connections[senderid].ready = true;
			ready(cb);
		});
		facebookClient.on('message', function(message){
			console.log(message);
		});

		facebookClient.on('composing', function(from){
			console.log(from + ' is composing a message');
		});
		facebookClient.on('error', function () {
			if (err == 'XMPP authentication failure') {
				// Yo what?
				delete connections[senderid];
			}
		});
	} else {
		ready(cb);
	}
	
	function ready(cb) {
		_sendMessage(connections[senderid], receiverId, message);
		cb && cb();
	}
}

var _sendMessage = function (client, receiverId, message) {
	client.send('-'+receiverId+'@chat.facebook.com', message);
}