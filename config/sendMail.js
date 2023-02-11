const nodemailer = require('nodemailer');
const mailGun = require('nodemailer-mailgun-transport');

const auth = {
    auth: {
        api_key: '8382843de5b9050945d5731fff11847d-d1a07e51-1d2c8453',
        domain: 'https://api.mailgun.net/v3/sandbox3b29d0ab274446d68a94058765dd0631.mailgun.org'
    }
};

const transporter = nodemailer.createTransport(mailGun(auth));

const sendMail = (name, emailFrom, emailTo, subject, text, func) => {
    const mailOptions = {
        sender: name,
        from: emailFrom,
        to: emailTo,
        subject: subject,
        text: text
    };
    transporter.sendMail(mailOptions, function(err, data) {
        if (err) {
            func(err, null);
        } else {
            func(null, data);
        }
    });
}

// Exporting the sendmail
module.exports = sendMail;