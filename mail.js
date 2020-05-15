
const mailConfig = require('./mailConfig.json');

function send(to, subject, message, html, attachments) {
    // для отправки почты
let nodemailer = require('nodemailer');
//var transporter = nodemailer.createTransport({'service':'smtps','host': '192.168.0.254', 'port': '25', secure: false, ignoreTLS: true});
//var transporter = nodemailer.createTransport("SMTP",{
//        service: "Yandex",
//        host: 'smtp.yandex.ru',
//        port: 465,
//        secure: true, // true for 465, false for other ports
//        auth: {
//            user: "",  // to be replaced by actual username and password
//            pass: ""
//        }
//    });

let transporter = nodemailer.createTransport(mailConfig);

// verify connection configuration
transporter.verify(function(error, success) {
   if (error) {
        console.log(error);
   } else {
        console.log('Mail server is ready to take our messages');
   }
});

let mailData = {
    from: 'noreply@botboom.ru',
    to: to,
    subject: subject,
    text: message
};

if(html !== undefined) mailData.html = html;
if(attachments) mailData.attachments = attachments;

transporter.sendMail(mailData, function(error, info){
if(error){
    return console.log(error);
    }
    console.log('Message sent: ' + info.response);
});
}

module.exports.send = send;