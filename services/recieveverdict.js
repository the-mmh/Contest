const amqp = require('amqplib/callback_api');

var main = require('../app');

CLOUDAMQP_URL = process.env.CLOUDAMQP_URL;

function recieveverdict() {
    amqp.connect(CLOUDAMQP_URL, function(error0, connection, req) {
        if (error0) {
            throw error0;
        }
        console.log('CloudAMQP Connected');

        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }

            var queue = 'verdict';
            channel.assertQueue(queue, {
                durable: true
            });

            console.log(" [*] Waiting for messages in %s", queue);
            channel.consume(queue, function(msg) {

                var message = msg.content;

                console.log(" [x] Received %s", message);
                // await judge.worker(message);
                message = message.toString();
                message = message.split(',');

                main.io.emit('change', {
                        verdict: message[0],
                        time: message[1],
                        memory: message[2],
                        id: message[3]
                    })
                    // main.change(message);

                console.log("done bhai")
                channel.ack(msg);

            }, {
                noAck: false
            });
        });
    });
}

module.exports.recieveverdict = recieveverdict;