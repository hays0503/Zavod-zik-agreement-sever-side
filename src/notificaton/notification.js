const { constructPgClient } = require("./commonFunctions");
const { documentNotificationEmail } = require("./emailNotification/document");
const {
  documentTaskNotificationEmail,
} = require("./emailNotification/documentTask");

//Cлушает базу. Когда приходит триггер notification, отправляет нотификацию
function listenToDBAndSendEmail(connectionString) {
  const pgClient = constructPgClient(connectionString);
  pgClient.query("LISTEN document_logs");
  pgClient.query("LISTEN document_tasks_logs");
  pgClient.on("notification", async (data) => {
    const dbPayload = JSON.parse(data.payload);
    console.log("notification waiting to be send:", dbPayload);
    switch (dbPayload.type) {
      case "document_logs":
        documentNotificationEmail(dbPayload);
        break;
      case "document_tasks_logs":
        documentTaskNotificationEmail(dbPayload);
        break;
    }
  });
}

module.exports = { listenToDBAndSendEmail };
