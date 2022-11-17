const pg = require("pg");
const moment = require("moment");
const constants = require("../../config/constants");
let transporter = null;
let pgClient = null;

//Создает подключение к email серверу для отправки сообщений
function constructTransporter(certificate) {
  //mail transport
  const nodemailer = require("nodemailer");
  transporter = nodemailer.createTransport({
    host: "EXCHANGE.zik.loc",
    port: 25,
    secureConnection: true,
    tls: {
      rejectUnauthorized: false,
      maxVersion: "TLSv1.3",
      minVersion: "TLSv1",
      ca: [certificate],
    },
    auth: {
      user: "zikdogovory",
      pass: "123456Aa+",
    },
  });

  return transporter;
}

//Создает подключение, которое слушает базу данных
function constructPgClient(connectionString) {
  let emailPgClient = new pg.Client(connectionString);
  emailPgClient.connect();
  emailPgClient.query("LISTEN document_logs");
  emailPgClient.query("LISTEN document_tasks_logs");
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

function getEmail(userId) {
  const query = `
  SELECT email FROM users WHERE id = ${userId}`;
  return new Promise(function (resolve, reject) {
    pgClient.query(query, (err, result) => {
      if (err) {
        console.log("document notification: error head reply pg query:", err);
        reject(err);
      }
      return resolve(result.rows[0].email);
    });
  });
}

function getDocument(documentId) {
  const query = `
  SELECT 
    doc.title, doc.date_created,doc_routes.name as route_name 
  FROM 
    documents as doc LEFT JOIN document_routes as doc_routes ON doc.route_id=doc_routes.id 
  WHERE 
    doc.id = ${documentId}`;
  return new Promise(function (resolve, reject) {
    pgClient.query(query, (err, result) => {
      if (err) {
        console.log("document notification: error head reply pg query:", err);
        reject(err);
      }
      return resolve(result.rows[0]);
    });
  });
}

function docTextParse(document) {
  const dateCreated = moment(document.date_created).format("YYYY-MM-DD HH:mm");
  return `${document.title} от ${dateCreated}, тип ${document.route_name}`;
}

//TODO: Необходимо переделать хранимки и более строго отслеживать, что именно произошло. То надо в любой момент понимать в каком разделе документ находится сейчас
/**
 * @description Функция возвращает сообщение согласно типу поступившего апдейта документа
 * @returns Текст нотификации
 */
function getTextByType_document(type, document) {
  const docText = docTextParse(document);
  let result = `${docText} - требует вашего решения`;
  switch (type) {
    case 1:
      result = `${docText} - утвержден и находится в разделе "Согласованные"`;
      break;
    case 3:
      result = `${docText} - отклонен и находится в разделе "Отклоненные"`;
      break;
    case 4:
      result = `${docText} - необходима доработка по документу. Он находится в разделе "На доработке"`;
      break;
  }
  return result;
}
/**
 * @description Функция возвращает сообщение согласно типу поступившего апдейта поручения
 * @returns Текст нотификации
 */
function getTextByType_documentTask(type, document) {
  let docText = docTextParse(document);
  //TODO: Разобраться почему не передается в document_task_update type=2. Либо просто переделать хранимку после введения миграций
  let result = `Поручение по документу ${docText} выполнено`;
  switch (type) {
    case 1:
      result = `Вами получено новое поручение по документу ${docText}`;
      break;
    case 2:
      result = `Поручение по документу ${docText} выполнено`;
      break;
  }
  return result;
}

/**
 * @description Функция, которая отправляет нотификацию при изменении в таблице движения документов
 * */
function documentNotification(dbPayload) {
  console.log("document notification: events", dbPayload);
  const userId = dbPayload.data.user_id;
  const documentId = dbPayload.data.document_id;
  const notificationType = dbPayload.data.type;
  //Если у нас есть кому посылать мыло
  if (userId) {
    (async () => {
      //то мы ассинхронно узнаем его мыло и имя документа на уведомление и дожидаемся всей информации
      const emailPromise = getEmail(userId);
      const documentNamePromise = getDocument(documentId);
      Promise.all([emailPromise, documentNamePromise])
        .then((values) => {
          const email = values[0];
          const document = values[1];
          const text = getTextByType_document(notificationType, document);
          //Если есть email  у пользователя и есть текст, который мы хотим отправить, то отправляем письмо
          if (email && text) {
            sendMail(email, text);
          }
        })
        .catch();
    })();
  }
}

function getDocumentByTaskId(taskId) {
  const query = `
  SELECT 
    doc.title, doc.date_created,doc_routes.name as route_name 
  FROM 
    documents as doc LEFT JOIN document_routes as doc_routes ON doc.route_id=doc_routes.id 
  WHERE 
    doc.id = (SELECT document_id FROM document_tasks WHERE id=${taskId}) `;
  return new Promise(function (resolve, reject) {
    pgClient.query(query, (err, result) => {
      if (err) {
        console.log(
          "document task notification: error head reply pg query:",
          err
        );
        reject(err);
      }
      console.log("document name received");
      return resolve(result.rows[0]);
    });
  });
}

/**
 * @description Функция, которая отправляет нотификацию при изменении в таблице движения поручений. Пока что отправляет только сообщения о новом поручении и выполненном поручении
 * */
function documentTaskNotification(dbPayload) {
  console.log("document task notification: events", dbPayload);
  const userId = dbPayload.data.user_id;
  const taskId = dbPayload.data.task_id;
  const notificationType = dbPayload.data.type;
  //Если у нас есть кому посылать мыло
  if (userId) {
    (async () => {
      //то мы ассинхронно узнаем его мыло и имя документа на уведомление и дожидаемся всей информации
      const emailPromise = getEmail(userId);
      const documentNamePromise = getDocumentByTaskId(taskId);
      Promise.all([emailPromise, documentNamePromise])
        .then((values) => {
          const email = values[0];
          const document = values[1];
          const text = getTextByType_documentTask(notificationType, document);
          //Если есть email  у пользователя и есть текст, который мы хотим отправить, то отправляем письмо
          if (email && text) {
            sendMail(email, text);
          }
        })
        .catch();
    })();
  }
}

module.exports = { sendMail, listenToDBAndSendEmail };
