// $he-green: #48E0B5;
// $he-blue: #44b6eb;
// $he-purple: #a58be8;
// $he-orange: #f5c265;
// $he-red: #f0567f;
// $he-white: #cdddef;

module.exports = function(RED) {
    "use strict";

    var helium = require('nodehelium'),
        msgpack = require('msgpack');


    function HeliumAtom(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.mac = config.mac;
        if (this.credentials) {
            this.token = this.credentials.token;
        }
    }

    RED.nodes.registerType('helium-atom', HeliumAtom, {
        credentials: {
            token: {type: 'text'}
        }
    });


    function HeliumIn(config) {
        RED.nodes.createNode(this, config);

        this.atom = config.atom;
        this.atomConfig = RED.nodes.getNode(this.atom);

        if (this.atomConfig) {
            // TODO -- find out about other client events
            // this.status({fill:"#f5c265", text: "Connecting...", shape: "hexagon"});

            this.client = new helium.Helium();

            var node = this;

            this.client.open();

            this.client.on('message', function(data){
                var msg = {atom_mac: node.atomConfig.mac};

                console.log(data.message)

                var l = data.message.length;
                try {
                    msg.payload = msgpack.unpack(new Buffer(data.message));
                    node.send(msg);
                    node.status({text:l +" b->o "+ JSON.stringify(msg.payload).length});
                }
                catch (e) {
                    node.warn("Bad decode: "+e);
                    node.status({text:"not a msgpack buffer"});
                }
            });

            this.client.subscribe(this.atomConfig.mac, this.atomConfig.token);

            this.on("close", function() {
                node.client.close();
            });
        } else {
            this.error("Atom is not configured");
        }
    }

    RED.nodes.registerType("helium-in", HeliumIn);

    function HeliumOut(config) {
        RED.nodes.createNode(this, config);

        this.atom = config.atom;
        this.atomConfig = RED.nodes.getNode(this.atom);

        if (this.atomConfig) {

            this.client = new helium.Helium();

            var node = this;

            this.client.open();

            this.on('input', function (msg) {
                var packedPayload = msgpack.pack(msg.payload);
                client.send(node.atomConfig.mac, node.atomConfig.token, packedPayload.toString());
            });

            this.on("close", function() {
                node.client.close();
            });
        } else {
            this.error("Node MAC or Token is not configured");

            this.on('input', function(){
                node.warn("Node MAC or Token is not configured");
            });
        }
    }    

    RED.nodes.registerType("helium-out", HeliumOut);
}
