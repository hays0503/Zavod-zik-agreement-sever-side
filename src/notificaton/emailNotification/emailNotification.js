const path = require("path");
const fs = require("fs");
const constants = require("../../../config/constants");
const certPath3 = path.join(__dirname, "../../../SSL/EXCHANGE.cer");
const nodemailer = require("nodemailer");
const certificateForMail = fs.readFileSync(certPath3);

const transporter = constructTransporter();

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
    auth: {
      user: "zikdogovory",
      pass: "123456Aa+",
    },
  });

  return transporter;
}

//Функция для отправки email. Если не был предварительно создан транспортер, требует сертификат для первоначальной инициализации
function sendMail(receiver, text = null) {
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
      from: "zikdogovory@zik.kz",
      to: receiver,
      subject: "Новые события на портале ZiK-Договора",
      text: text ? text : "Есть непрочитанные элементы в вашем аккаунте.",
    },
    function (err, info) {
      if (err) {
        console.log("mail error:", err);
      } else {
        console.log("mail ok", info);
      }
    }
  );
}

module.exports = { sendMail };
