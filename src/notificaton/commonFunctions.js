const moment = require("moment");
const pg = require("pg");

let pgClient = null;

//Создает подключение, которое слушает базу данных
function constructPgClient(connectionString) {
  if (!pgClient) {
    pgClient = new pg.Client(connectionString);
    pgClient.connect();
    pgClient.query("LISTEN document_logs");
    pgClient.query("LISTEN document_tasks_logs");
  }
  return pgClient;
}

function docTextParse(document) {
  const dateCreated = moment(document.date_created).format("YYYY-MM-DD HH:mm");
  return `${document.title} от ${dateCreated}, тип ${document.route_name}`;
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

module.exports = {
  constructPgClient,
  docTextParse,
  getDocument,
  getDocumentByTaskId,
  getEmail,
  pgClient,
};
