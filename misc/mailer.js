const nodemailer  = require('nodemailer');
const config = require('../config/mailer');

const transport = nodemailer.createtransport({
	service:'Mailgun',
	auth: {
		user: config.MAILGUN_USER,
		pass: config.MAILGUN_PASS
	},
	tlc: {
		rejectUnauthorized: false
	}

});


module.exports = {
	sendEMail(from, to, subject, html) {
		return new Promise((resolve, reject) => {
			transport.sendMail({ from, subject, to, html}, (err, info) => {
				if(err) reject(err);

				resolve(info);
			})
		})
	}
}
