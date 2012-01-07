// Example OpenFlow Controller written for Node.js
// Prototype eventing system handling of OF messages
// Author : Gary Berger, Cisco Systems, inc.
var net = require('net');
var util = require('util');
var events = require('events');
var oflib = require('../oflib-node');
var decode = require('./decoder.js')
var nfutils = require('./nf-utils.js')
var ofp = require('../oflib-node/lib/ofp.js')

// fix this!!
var version = "1.0"
var ofpp = require('../oflib-node/lib/ofp-' + version + '/ofp.js')
var switchStream = new oflib.Stream();



var NodeFlowServer = exports.NodeFlowServer = function() {
        var self = this
        sessions = []
        l2table = {}
    }

NodeFlowServer.prototype = new process.EventEmitter();

NodeFlowServer.prototype.start = function(address, port) {
    var self = this

    var socket = []
    var server = net.createServer()

    server.listen(port, address, function(err, result) {
        util.log("NodeFlow Controller listening on " + address + ':' + port)
        self.emit('started', {
            "Config": server.address()
        })
    })


    server.on('connection', function(socket) {

        socket.setNoDelay(noDelay = true)

        var sessionID = socket.remoteAddress + ":" + socket.remotePort
        sessions[sessionID] = new sessionKeeper(socket)

        util.log("Connection from : " + sessionID)

        socket.on('data', function(data) {
            var msgs = switchStream.process(data);
            msgs.forEach(function(msg) {
                // var msg = oflib.unpack(data, 0)
                if (msg.hasOwnProperty('message')) {
                   
                    self._processMessage(msg, sessionID)
                } else {
                    util.log('Error: Message is unparseable')
                    console.dir(data)
                }
            })
        })

        socket.on('close', function(data) {
            delete sessions[socket.remoteAddress + socket.remotePort]
            util.log("Client Disconnect ")
        })

        socket.on('error', function(data) {
            util.log("Client Error ")

        })
    })

    self.on('SENDPACKET', function(obj) {
        nfutils.sendPacket(obj, obj.data.sessionID)
    })

    self.on('INSTALLFLOW', function(obj) {
        nfutils.installFlow(obj, obj.data.sessionID)
    })

    self.on('OFPT_PACKET_IN', function(obj) {
        var packet = decode.decodeethernet(obj.message.body.data, 0)
        nfutils.do_l2_learning(obj, packet)
        self._forward_l2_packet(obj, packet)

    })


}

var sessionKeeper = exports.sessionKeeper = function(socket) {
        this.sessionSocket = socket
        this.dpid = []
    }

NodeFlowServer.prototype._setDPId = function(obj, sessionID) {
    var dpid = obj.message.body.datapath_id
    sessions[sessionID].dpid = dpid
}


NodeFlowServer.prototype._processMessage = function(msg, sessionID) {

    var self = this
    //var mcounters = require('./counters.js')
    if (msg.hasOwnProperty('message')) {

        var type = msg.message.header.type

        switch (type) {
        case 'OFPT_HELLO':
            nfutils.sendsyncmessage('OFPT_HELLO', msg, sessionID)
            break;
        case 'OFPT_ERROR':
            // TODO
            break;
        case 'OFPT_ECHO_REQUEST':

            nfutils.sendsyncmessage('OFPT_ECHO_REPLY', msg, sessionID)
            break;
        case 'OFPT_PACKET_IN':

            self.emit('OFPT_PACKET_IN', {
                "message": msg.message,
                "sessionID": sessionID,
                "dpid": sessions[sessionID].dpid
            })
            break;
        case 'OFPT_FEATURES_REPLY':
            nfutils.sendsyncmessage(type, msg, sessionID)
            break;
        case 'OFPT_PORT_STATUS':
            //TODO
            break;
        case 'OFPT_FLOW_REMOVED':
            //TODO
            break;
        default:
            //TODO
            util.log("Unknown OF Type : " + type)
            break;
        }

    } else {
        util.log('Failed to get header')
        console.dir(msg)
        return
    }
}


NodeFlowServer.prototype._forward_l2_packet = function(obj, packet) {
    var self = this
    var dl_dst = packet.dhost
    var dl_src = packet.shost
    var in_port = l2table[obj.dpid][dl_src]
    var dpid = obj.dpid

    if ((dl_dst != 'ff:ff:ff:ff:ff:ff') && l2table[dpid].hasOwnProperty(dl_dst)) {


        var prt = l2table[dpid][dl_dst]
        if (prt == in_port) {
            util.log("*warning* learned port = " + in_port + ", system=nodeFlow")
            obj.packet = nfutils.setOutFloodPacket(obj, prt)
            self.emit("SENDPACKET", {
                "data": obj
            })
        } else {
            out_port = prt
            var outtxt = 
            util.log(util.format("Installing flow for destination: %s source: %s  in_port: %s\tout_port: %s\tsystem=NodeFlow", dl_dst, dl_src, in_port,out_port))
            obj.packet = nfutils.setFlowModPacket(obj, packet, in_port, out_port)
            self.emit("INSTALLFLOW", {
                "data": obj
            })

        }

    } else {
        util.log("Flooding Unknown id:" + obj.message.body.buffer_id)
        obj.packet = nfutils.setOutFloodPacket(obj, in_port)
        self.emit("SENDPACKET", {
            "data": obj
        })


    }
}