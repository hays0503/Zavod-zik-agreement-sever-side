const path = require("path");
const fs = require("fs");
const constants = require("../../../config/constants");
const certPath3 = path.join(__dirname, "../../../SSL/EXCHANGE.cer");
const certPathException = path.join(__dirname, "../../../SSL/cert.crt");
const nodemailer = require("nodemailer");
const certificateForMail = fs.readFileSync(certPath3);
const certificateForMailException = fs.readFileSync(certPathException);

let transporter = constructTransporter();
let isExceptionAlerted = false;

//Создает подключение к email серверу для отправки сообщений
function constructTransporter() {
  console.log("transporter constructed");
  //mail transport
  const transporter = nodemailer.createTransport({
    host: "EXCHANGE.zik.loc",
    port: 25,
    secureConnection: true,
    tls: {
      rejectUnauthorized: false,
      maxVersion: "TLSv1.3",
      minVersion: "TLSv1",
      ca: [certificateForMail],
    },
    // auth: {
    //   user: "zikdogovory",
    //   pass: "123456Aa+",
    // },
  });

  return transporter;
}

//Создает подключение к email серверу для отправки сообщений
function constructTransporterException() {
  //mail transport
  transporter = nodemailer.createTransport({
    host: "smtp.mail.ru",
    port: 465,
    secure: true,
    tls: {
      rejectUnauthorized: false,
      ca: [certificateForMailException],
    },
    auth: {
      user: "noszone@mail.ru",
      pass: "XcpTb2r4FZ5H1fbNrzHJ",
    },
  });

  return transporter;
}
//Функция для отправки email. Если не был предварительно создан транспортер, требует сертификат для первоначальной инициализации
function sendMail(receiver, text = null, sender = "zikdogovory@zik.kz") {
  if (constants.isSendEmail !== 1) {
    console.log("email notification disabled");
    return;
  }
  if (!certificateForMail) {
    console.log(
      "email notification one letter send: no certificate provided and no transporter constructed"
    );
    return;
  }
  console.log("email send to smtp");
  transporter.sendMail(
    {
      from: sender,
      to: receiver,
      subject: "Новые события на портале ZiK-Договора",
      text: text ? text : "Есть непрочитанные элементы в вашем аккаунте.",
    },
    function (err, info) {
      if (err) {
        console.log("mail error:", err);
        if (!isExceptionAlerted) {
          transporter = nodemailer.transporter =
            constructTransporterException();
          sendMail(receiver, text, "noszone@mail.ru");
        }
        isExceptionAlerted = true;
      } else {
        isExceptionAlerted = false;
        console.log("mail ok", info);
      }
    }
  );
}

module.exports = { sendMail };
