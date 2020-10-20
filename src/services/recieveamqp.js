const amqp = require('amqplib/callback_api');
const judge = require('./judge');

CLOUDAMQP_URL = process.env.CLOUDAMQP_URL;

function recieveamqp() {
    amqp.connect(CLOUDAMQP_URL, function(error0, connection) {
        if (error0) {
            req.flash('error', "Some error occurred in receiving submission");
            throw error0;
        }
        console.log('CloudAMQP Connected');

        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }

            var queue = 'judge';
            channel.assertQueue(queue, {
                durable: true
            });

            console.log(" [*] Waiting for messages in %s", queue);

            try {
                channel.consume(queue, async function(msg) {
                    var message = msg.content.toString();
                    console.log(" [x] Received %s", message);

                    judge.queue(message);
                    console.log("qrated");
                    channel.ack(msg);
                }, {
                    noAck: false
                });
            } catch (error) {
                req.flash('error', "Some error occurred in receiving submission");

            }
        });
    });
}

module.exports.recieveamqp = recieveamqp;