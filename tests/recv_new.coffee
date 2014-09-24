# var BOSH_SERVICE = 'http://bosh.metajack.im:5280/xmpp-httpbind'
#console.log("victims.length:", victims.length);

disconnect = (conn) ->
  conn.disconnect()
  return
connect = (username, password, endpoint, route, onStanza, onConnect) ->
  conn = new Strophe.Connection(endpoint)
  conn.connect username, password, onConnect, 20, null, route #null
  conn.xmlInput = onStanza
  conn
start_test = (options) ->
  options.users.forEach (user_info) ->
    onStanza = (stanza) ->
      
      #console.log("Received:", stanza.nodeName);
      #console.log("Number of Children:", stanza._childNodes.length);
      stanza._childNodes.forEach (s) ->
        
        #console.log("child:", s.nodeName, s._childNodes.length);
        if s.nodeName is "MESSAGE" and s._childNodes and s._childNodes.length > 0
          
          #console.log("FILTER:", x.nodeName);
          s._childNodes.filter((x) ->
            x.nodeName is "BODY"
          ).forEach (x) ->
            console.log "Got:", x.innerHTML
            return

        return

      return
    onConnect = (status) ->
      console.log "onConnect:", status, dutil.rev_hash(Strophe.Status)[status]
      if status is Strophe.Status.CONNFAIL
        console.log "CONNFAIL for:", jid
        process.exit 1
      else if status is Strophe.Status.ERROR
        console.log "ERROR for:", jid
        process.exit 1
      else if status is Strophe.Status.AUTHFAIL
        console.log "AUTHFAIL for:", jid
        process.exit 1
      
      # Send presence
      else conn.send $pres()  if status is Strophe.Status.CONNECTED
      return
    jid = user_info.jid
    password = user_info.password
    route = user_info.route
    conn = connect(jid, password, options.endpoint, route, onStanza, onConnect)
    return

  return
main = ->
  opts = require("tav").set(
    users:
      note: "The file containing the credentials of all users " + "(check the comments in this file for the format of the file to pass here"

    endpoint:
      note: "The BOSH service endpoint (default: http://localhost:5280/http-bind/)"
      value: "http://localhost:5280/http-bind/"
  )
  opts.users = require("./" + opts.users).users
  options = opts
  start_test options
  return
options = {}
strophe = require("../strophe/strophe.js").Strophe
dutil = require("../src/dutil.js")
us = require("underscore")
Strophe = strophe.Strophe
$iq = strophe.$iq
$msg = strophe.$msg
$build = strophe.$build
$pres = strophe.$pres
out_queue = []
SEND_EVERY_MSEC = 1000
MESSAGES_TO_SEND = 10
PACKETS_TO_SEND = 7
setInterval (->
  victims = out_queue.splice(0, PACKETS_TO_SEND)
  victims.forEach (v) ->
    v.conn.send v.msg
    return

  return
), SEND_EVERY_MSEC
main()
