// var BOSH_SERVICE = 'http://bosh.metajack.im:5280/xmpp-httpbind'

var options = { };
var strophe = require("../strophe/strophe.js").Strophe;
var dutil   = require("../src/dutil.js");
var us      = require("underscore");

var Strophe = strophe.Strophe;
var $iq     = strophe.$iq;
var $msg    = strophe.$msg;
var $build  = strophe.$build;
var $pres   = strophe.$pres;

var out_queue = [ ];

var SEND_EVERY_MSEC = 1000;
var MESSAGES_TO_SEND = 10;
var PACKETS_TO_SEND = 7;


setInterval(function() {
	var victims = out_queue.splice(0, PACKETS_TO_SEND);
	//console.log("victims.length:", victims.length);

	victims.forEach(function(v) {
		v.conn.send(v.msg);
	});
}, SEND_EVERY_MSEC);


function disconnect(conn) {
    conn.disconnect();
}


function connect(username, password, endpoint, route, onStanza, onConnect) {
    var conn = new Strophe.Connection(endpoint);
	conn.connect(username, password, onConnect, 20 /*null*/, null, route);
	conn.xmlInput = onStanza;
	return conn;
}

function start_test(options) {

	options.users.forEach(function(user_info) {
		var jid      = user_info.jid;
		var password = user_info.password;
		var route    = user_info.route;

		function onStanza(stanza) {
			//console.log("Received:", stanza.nodeName);
			//console.log("Number of Children:", stanza._childNodes.length);

			stanza._childNodes.forEach(function(s) {
				//console.log("child:", s.nodeName, s._childNodes.length);
				if (s.nodeName == "MESSAGE" && s._childNodes && s._childNodes.length > 0) {
					s._childNodes.filter(function(x) {
						//console.log("FILTER:", x.nodeName);
						return x.nodeName === "BODY";
					}).forEach(function(x) {
						console.log("Got:", x.innerHTML);
					});
				}
			});
		}

		function onConnect(status) {
			console.log("onConnect:", status, dutil.rev_hash(Strophe.Status)[status]);

			if (status == Strophe.Status.CONNFAIL) {
				console.log("CONNFAIL for:", jid);
				process.exit(1);
			}
			else if (status == Strophe.Status.ERROR) {
				console.log("ERROR for:", jid);
				process.exit(1);
			}
			else if (status == Strophe.Status.AUTHFAIL) {
				console.log("AUTHFAIL for:", jid);
				process.exit(1);
			}
			else if (status == Strophe.Status.CONNECTED) {
				// Send presence
				conn.send($pres());
			}
		}

		var conn = connect(jid, password, options.endpoint, route, onStanza, onConnect);
	});
}


function main() {
	var opts = require('tav').set({
		users: {
			note: 'The file containing the credentials of all users ' + 
				'(check the comments in this file for the format of the file to pass here'
		}, 
		endpoint: {
			note: 'The BOSH service endpoint (default: http://localhost:5280/http-bind/)', 
			value: 'http://localhost:5280/http-bind/'
		}
	});

	opts.users = require("./" + opts.users).users;

	options = opts;
	start_test(options);
}

main();
