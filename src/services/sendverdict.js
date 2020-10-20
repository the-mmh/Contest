var amqp = require('amqplib/callback_api');

CLOUDAMQP_URL = 'amqps://giarifma:r6gcUKQqsoPWzs7Ps7IplT_d0OuUhSO3@lionfish.rmq.cloudamqp.com/giarifma';

function sendverdict(msg) {
    amqp.connect(CLOUDAMQP_URL, function(err, connection) {
        if (err) {
            throw err;
        }

        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }

            var queue = 'verdict';
            channel.assertQueue(queue, {
                durable: true
            });
            try {
                channel.sendToQueue(queue, Buffer.from(msg), { persistent: true });
                console.log(" [x] Sent %s", msg);
            } catch (error) {
                next(error);
            }
        });
        setTimeout(function() {
            connection.close();
        }, 500);
    });
}

module.exports.sendverdict = sendverdict;