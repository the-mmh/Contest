var amqp = require('amqplib/callback_api');
const q = require('./judge');

CLOUDAMQP_URL = 'amqps://giarifma:r6gcUKQqsoPWzs7Ps7IplT_d0OuUhSO3@lionfish.rmq.cloudamqp.com/giarifma';

function recieveamqp(msg) {
    amqp.connect(CLOUDAMQP_URL, function(error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }

            var queue = 'judge';
            channel.assertQueue(queue, {
                durable: true
            });

            console.log(" [*] Waiting for messages in %s", queue);
            channel.consume(queue, function(msg) {
                var message = msg.content.toString();
                console.log(" [x] Received %s", message);
                //ToDo:
                q.push(message);

            }, {
                noAck: true
            });
        });
    });
}

module.exports.recieveamqp = recieveamqp;