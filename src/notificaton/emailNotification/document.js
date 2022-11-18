const { docTextParse, getEmail, getDocument } = require("../commonFunctions");

const { sendMail } = require("./emailNotification.js");

/**
 * @description Функция, которая отправляет нотификацию при изменении в таблице движения документов
 * */
function documentNotificationEmail(dbPayload) {
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
          let text = getTextByType_document(notificationType, document);
          if (email === "RyndychRD@zik.kz") {
            text = `Отправлено пользователю ${userId} ` + text;
          }
          //Если есть email  у пользователя и есть текст, который мы хотим отправить, то отправляем письмо
          if (email && text) {
            sendMail(email, text);
          }
        })
        .catch();
    })();
  }
}

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
    case 2:
      result = `${docText} - требует вашего решения и находится в разделе "Входящие"`;
      break;
    case 3:
      result = `${docText} - отклонен и находится в разделе "Отклоненные"`;
      break;
    case 4:
      result = `${docText} - необходима доработка по документу. Он находится в разделе "На доработке"`;
      break;
    case 5:
      result = `${docText} - документ направлен на подписание ООПЗ. Он находится в разделе "Регистрация документов"`;
      break;
    case 6:
      result = `${docText} - документ подписан ООПЗ. Он находится в разделе "Документы подписанные в ООПЗ"`;
      break;
    case 7:
      result = `${docText} - необходима исполнен. Он находится в разделе "Исполненные"`;
      break;
  }
  return result;
}

module.exports = {
  documentNotificationEmail,
};
