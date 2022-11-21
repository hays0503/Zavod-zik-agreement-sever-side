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
  const messages = {
    1: ' - утвержден и находится в разделе "Согласованные"',
    2: ' - требует вашего решения и находится в разделе "Входящие"',
    3: ' - отклонен и находится в разделе "Отклоненные"',
    4: ' - необходима доработка по документу. Он находится в разделе "На доработке"',
    5: ' - документ направлен на подписание ООПЗ. Он находится в разделе "Регистрация документов"',
    6: ' - документ подписан ООПЗ. Он находится в разделе "Документы подписанные в ООПЗ"',
    7: ' - необходима исполнен. Он находится в разделе "Исполненные"',
  };
  result = docText + messages[type];
  return result;
}

module.exports = {
  documentNotificationEmail,
};
