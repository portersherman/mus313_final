var express = require("express");
var app = express();
var server = app.listen(8000);
app.use(express.static("public"));

var osc = require('node-osc'), io = require('socket.io').listen(8080);

var oscServer, oscClient;
var isConnected = false;

io.sockets.on('connection', function (socket) {
	socket.on("config", function (obj) {
		isConnected = true;
    	oscServer = new osc.Server(obj.server.port, obj.server.host);
	    oscClient = new osc.Client(obj.client.host, obj.client.port);
	    oscClient.send('/status', socket.id + ' connected');
		oscServer.on('message', function(msg, rinfo) {
			io.sockets.emit("message", msg);
		});
		socket.emit("connected", 1);
	});
 	socket.on("message", function (obj) {
		oscClient.send.apply(oscClient, obj);
  	});
	socket.on('disconnect', function(){
		if (isConnected) {
			// oscClient.kill();
			// oscServer.kill();
		}
  	});
});