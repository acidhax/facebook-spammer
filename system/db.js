var express = require('express');
var redis = require('redis');
var RedisPubSub, RedisStore;

/*
* Vars
*/
var sessionSecret = process.env.sessionSecret || 'ONE TWO TIE MY SHOE THREE FOUR GET THE FUCK OUT OF MY CODE',
	sessionKey = process.env.sessionKey || 'matbee.sid',
	cookieParser = express.cookieParser(sessionSecret),

/*
* Global redis initialization.
*/
var readClient = redis.createClient(10254, "pub-redis-10254.us-east-1-4.1.ec2.garantiadata.com");
var writeClient = redis.createClient(10254, "pub-redis-10254.us-east-1-4.1.ec2.garantiadata.com");
var subClient = redis.createClient(10254, "pub-redis-10254.us-east-1-4.1.ec2.garantiadata.com");
var pubClient = redis.createClient(10254, "pub-redis-10254.us-east-1-4.1.ec2.garantiadata.com");

if (fs.existsSync('../redis-pub-sub')) {
  RedisPubSub = require('../redis-pub-sub');
} else {
  RedisPubSub = require('redis-sub');
}

if (fs.existsSync('../connect-redis-pubsub')) {
  RedisStore = require('../connect-redis-pubsub')(express);
} else {
  RedisStore = require('connect-redis-pubsub')(express);
}

var redisSub = new RedisPubSub({pubClient: pubClient, subClient: subClient});
var sessionStore = new RedisStore({
  prefix: process.env.sessionPrefix || 'spammerSession:',
  pubsub: redisSub
});

module.exports = {
	readClient: readClient,
	writeClient: writeClient,
	pubClient: pubClient,
	subClient: subClient,
	redisSub: redisSub,
	sessionStore: sessionStore,
	sessionSecret: sessionSecret,
	sessionKey: sessionKey
};