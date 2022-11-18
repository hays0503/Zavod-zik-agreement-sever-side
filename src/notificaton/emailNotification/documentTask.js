const {
  docTextParse,
  getEmail,
  getDocumentByTaskId,
} = require("../commonFunctions");

const { sendMail } = require("./emailNotification.js");
/**
 * @description Функция возвращает сообщение согласно типу поступившего апдейта поручения
 * @returns Текст нотификации
 */
function getTextByType_documentTask(type, document) {
  let docText = docTextParse(document);
  let result = `Пришел апдейт по поручению ${docText}`;
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
 * @description Функция, которая отправляет нотификацию при изменении в таблице движения поручений. Пока что отправляет только сообщения о новом поручении и выполненном поручении
 * */
function documentTaskNotificationEmail(dbPayload) {
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

module.exports = {
  documentTaskNotificationEmail,
};
