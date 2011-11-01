var net = require('net');
var util = require('util');

function OF_MESSAGE(socket) {  
	this.socket = socket
	
}

OF_MESSAGE.prototype.echo = function(socket) {
    buf_OF_ECHO = [0x01, 0x03, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00]
    var OF_ECHO = new Buffer(buf_OF_ECHO)
    socket.write(OF_ECHO)
    util.log("ECHO_REPLY")
}

OF_MESSAGE.prototype.hello = function(socket) {
    buf_OF_HELLO = [0x01, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00]
    var OF_HELLO = new Buffer(buf_OF_HELLO)
    socket.write(OF_HELLO)
}

OF_MESSAGE.prototype.feature_request = function(socket) {
    buf_OF_FEAT_REQ = [0x01, 0x05, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00]
    var OF_FEAT_REQ = new Buffer(buf_OF_FEAT_REQ)
    socket.write(OF_FEAT_REQ)
    util.log("SENT_FEATURE_REQUEST")
}

OF_MESSAGE.prototype.flow_mod = function(socket) {
    buf_OF_FLOW_MOD = [
    0x01, 0x0E, 0x00, 0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x1e, 0x7f,
    0xfb, 0x10, 0x62, 0xa3, 0x62, 0xfb, 0x20, 0xc4, 0x2d, 0xdb, 0xff, 0xff, 0x00, 0x00, 0x08, 0x00,
    0x00, 0x01, 0x00, 0x00, 0x0a, 0x00, 0x00, 0x02, 0x0a, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3c, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x01, 0x1b, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0x00, 0x03, 0x00, 0x00]
    var OF_FLOW_MOD = new Buffer(buf_OF_FLOW_MOD)
    socket.write(OF_FLOW_MOD)

}  

module.exports = OF_MESSAGE