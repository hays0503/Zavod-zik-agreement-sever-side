const pg = require("pg");
const constants = require("../../config/constants");

let transporter = null;
let pgClient = null;

//Создает подключение к email серверу для отправки сообщений
function constructTransporter(certificate) {
  //mail transport
  const nodemailer = require("nodemailer");
  transporter = nodemailer.createTransport({
    host: "smtp.mail.ru",
    port: 465,
    secure: true,
    tls: {
      rejectUnauthorized: false,
      ca: [certificate],
    },
    auth: {
      user: "noszone@mail.ru",
      pass: "XcpTb2r4FZ5H1fbNrzHJ",
    },
  });

  return transporter;
}

//Создает подключение, которое слушает базу данных
function constructPgClient(connectionString) {
  let emailPgClient = new pg.Client(connectionString);
  emailPgClient.connect();
  emailPgClient.query("listen document_logs");
  emailPgClient.query("listen document_tasks_logs");
  return emailPgClient;
}

//Функция для отправки email. Если не был предварительно создан транспортер, требует сертификат для первоначальной инициализации
function sendMail(receiver, text = null, certificate = null) {
  if (constants.isSendEmail !== 1) {
    console.log("email notification disabled");
    return;
  }
  if (!transporter && !certificate) {
    console.log(
      "email notification one letter send: no certificate provided and no transporter constructed"
    );
    return;
  }
  if (!transporter) {
    transporter = constructTransporter(certificate);
  }
  transporter.sendMail(
    {
      from: "noszone@mail.ru",
      to: receiver,
      subject: "[Новые события на портале ZiK-Договора]",
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

//Иницианлизирует переменные для отправки email и слушает базу. Когда приходит триггер notification, отправляет нотификацию
function listenToDBAndSendEmail(connectionString, certificate) {
  transporter = constructTransporter(certificate);
  pgClient = constructPgClient(connectionString);
  pgClient.on("notification", async (data) => {
    const dbPayload = JSON.parse(data.payload);
    console.log("notification waiting to be send:", dbPayload);
    switch (dbPayload.type) {
      case "document_logs":
        documentNotification(dbPayload);
        break;
      case "document_tasks_logs":
        documentTaskNotification(dbPayload);
        break;
    }
  });
  return pgClient;
}

//Функция, которая отправляет нотификацию при изменении в таблице движения документов
function documentNotification(dbPayload) {
  console.log("document notification: events", dbPayload);
  if (dbPayload.data.user_id) {
    pgClient.query(
      `SELECT email FROM users WHERE id = ${dbPayload.data.user_id}`,
      (err, result) => {
        if (err) {
          return console.error(
            "document notification: error head reply pg query:",
            err
          );
        }
        if (result.rows[0].email) sendMail(result.rows[0].email);
      }
    );
  }
}

//Функция, которая отправляет нотификацию при изменении в таблице движения поручений
function documentTaskNotification(dbPayload) {
  console.log("document task notification: events", dbPayload);
  if (dbPayload.data.user_id) {
    pgClient.query(
      `SELECT email FROM users WHERE id = ${dbPayload.data.user_id}`,
      (err, result) => {
        if (err) {
          return console.error(
            "document task notification: error head reply pg query:",
            err
          );
        }
        if (result.rows[0].email) sendMail(result.rows[0].email);
      }
    );
  }
}

module.exports = { sendMail, listenToDBAndSendEmail };
