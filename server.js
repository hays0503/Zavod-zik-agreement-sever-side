'use strict'
require('events').EventEmitter.prototype._maxListeners = 100;
const constants = require("./config/constants");
const fs = require('fs');
// express
const favicon = require('serve-favicon');
const express = require('express');
const path = require('path');
const session = require('express-session')
const compression = require('compression');
const excel = require('./src/excel/excel')

// authentication
const passport = require('passport');
const methodOverride = require('method-override');
const { initializePassport } = require('./config/passportConfig');
// DB session
const pgSession = require('connect-pg-simple')(session);
const sessionPool = require('pg').Pool;

const sessionConfig = {
    store: new pgSession({
        pool: new sessionPool({...constants.database}),
        tableName: constants.session.table
    }),
    name: 'SID',
    secret: constants.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 100000 * 60 * 60 * 24 * 7,
        nameSite: true,
        secure: true
    }
}

const pg = require('pg');
const connectionString = `postgres://${constants.database.user}:${constants.database.password}@${constants.database.host}:${constants.database.port}/${constants.database.database}`;

// websocket
const WebSocket = require('ws');
const graphQLWebSocket = new WebSocket.Server({noServer: true});
// apollo
const cors = require('cors'); //ura
const corsOptions = {
    origin: `https://${constants.database.host}:${constants.database.port}`,
  credentials: true
}
const {ApolloServer} = require('apollo-server-express');
// SSL
const certPath1 = path.join(__dirname, './SSL/key.crt');//ura
const privateKey = fs.readFileSync(certPath1);
const certPath2 = path.join(__dirname, './SSL/cert.crt');
const certificate = fs.readFileSync(certPath2);
// my
const client = require("./config/pgConfig");
//guard cfg
const sdServerWSConfig = require("./config/sdServerWSConfig");
//Apollo cfg
const typeDefs = require("./src/graphql/schema.js");
const {publish} = require("./src/graphql/graphqlFunctions");
//fucntions
const {resolvers} = require("./src/graphql/resolvers");
const credentials = {key: privateKey, cert: certificate};
const bodyParser = require('body-parser');
const { skudLogger } = require("./src/core/functions");
//http
const https = require('https');
const multer = require('multer');
const app = express();
const httpsServer = https.createServer(credentials, app);

const httpsServerSdWs = https.createServer(credentials, app);
const wss = new WebSocket.Server({ server: httpsServerSdWs });

////////////////////////////////////////////////////////////////////global cfg
let getHost="'"+constants.host+"'";
let hrReportInData;
const debugFileLog = process.env.APPDATA + '\\sd.log';
console.log(constants);

//multer path
let uploadFolderPath = path.dirname(process.execPath) + '\\uploads';
console.log('Upload folder:', uploadFolderPath)

//mail transport
const nodemailer = require('nodemailer');
let transporter = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
    tls: {
        rejectUnauthorized: false,
        ca: [certificate]
    },
    auth: {
        user: "noszone@mail.ru",
        pass: "XcpTb2r4FZ5H1fbNrzHJ"
    }
});

const sendPopEmail = (sender) => {
    transporter.sendMail({
        from: "noszone@mail.ru",
        to: sender,
        subject: "[Новые события на портале ZiK-Договора]",
        text: "Есть непрочитанные элементы в вашем аккаунте."
    }, function (err, info) {
        if (err) {
            console.log('mail error:', err)
        } else {
            console.log('mail ok', info);
        }
    });
};

// настройка express
app.use(compression());
app.use(cors(corsOptions)); //ura
//// сессии
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
//// пределы post запросов
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
//// подгрузка favicon css js файлов
app.use(favicon(__dirname + '/build/favicon.ico'));
app.use('/static', express.static(path.join(__dirname, 'build/static')));
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// проверки на авторизованность
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
}

//email notifications
let emailPgClient = new pg.Client(connectionString);
emailPgClient.connect();
emailPgClient.query('listen document_logs');
emailPgClient.query('listen document_tasks_logs');
emailPgClient.on('notification', async (data) => {
    const dbPayload = JSON.parse(data.payload);
    console.log('document_logs insert:', dbPayload);
    switch (dbPayload.type) {
        case 'document_logs':
            console.log('notification: events', dbPayload);
            if (dbPayload.data.user_id) {
                emailPgClient.query(`SELECT email FROM users WHERE id = ${dbPayload.data.user_id}`, (err, result) => {
                    if (err) {
                        return console.error('error head reply pg query:', err);
                    }
                    //console.log("result.rows[0].id",result.rows[0].id)
                    if (result.rows[0].email) sendPopEmail(result.rows[0].email);
                });
            };
            break;
        case 'document_tasks_logs':
            console.log('notification: events', dbPayload);
            if (dbPayload.data.user_id) {
                emailPgClient.query(`SELECT email FROM users WHERE id = ${dbPayload.data.user_id}`, (err, result) => {
                    if (err) {
                        return console.error('error head reply pg query:', err);
                    }
                    //console.log("result.rows[0].id",result.rows[0].id)
                    if (result.rows[0].email) sendPopEmail(result.rows[0].email);
                });
            };
            break;
    }
});

//file downloads from browser
let filePgClient = new pg.Client(connectionString);
filePgClient.connect();
app.post('/api/files', (req, res, next) => {
    filePgClient.query( `SELECT id, filename, data_file FROM document_files WHERE id = ${req.body.item}`, (err, result) => {
        if (err) {
            return console.error('error head reply pg query:', err);
        }
        //console.log("result.rows[0].id",result.rows[0].id)
        let temp = {filename:result.rows[0].filename, type:'file_open', data:`${result.rows[0].data_file.substr(result.rows[0].data_file.lastIndexOf(',')+1)}`}
        sdServerWSConfig.connect.clients.forEach(async function each(ws) {
            console.log('filename', result.rows[0].filename, req.body.user, ws.id)
            if (req.body.user==ws.id)
            ws.send(JSON.stringify(temp))
        });
    });
});


//file downloads from browser(Скачивания файлов из таблиц по поручениям)
app.post('/api/tasks_files', (req, res, next) => {
    filePgClient.query( `SELECT id, filename, data_file FROM document_tasks_files WHERE id = ${req.body.item}`, (err, result) => {
        if (err) {
            return console.error('error head reply pg query:', err);
        }
        //console.log("result.rows[0].id",result.rows[0].id)
        let temp = {filename:result.rows[0].filename, type:'file_open', data:`${result.rows[0].data_file.substr(result.rows[0].data_file.lastIndexOf(',')+1)}`}
        sdServerWSConfig.connect.clients.forEach(async function each(ws) {
            if (req.body.user==ws.id)
            ws.send(JSON.stringify(temp))
        });
    });
});


app.post('/api/tasks_files_is_add_to_document', async (req, res, next) => {
    let client = require("./config/pgConfig")
    let id = req.body.item
    let result = await client.query( `SELECT id, filename
	FROM public.document_tasks_files
		WHERE task_id in  (select id 
								FROM public.document_tasks 
									WHERE document_id=${req.body.item}) and is_add_to_document=true`)
    console.log(result)
    res.json({ result: result.rows })

});


/*app.post('/api/notifications', (req, res, next) => {
    sendPopEmail(req.body.address)
    let temp = {type:'notification'}
    wss.clients.forEach(async function each(ws) {
        ws.send(JSON.stringify(temp))
    });
    console.log('notification arrived')
});*/
let tableData
app.post('/api/tabledata', (req, res, next) => {
	tableData=req.body.currentTableData;
	res.send(JSON.stringify({result: true}));
});


// предварительная обработка GET запросов
app.get('/*', (req, res, next) => {
    console.log(req.url);

    switch (req.url) {
        case '/logout': case '/logout/':
            req.logOut();
            res.redirect('/login');
            console.log(1000);
            break;
		case '/help/hr': case '/help/hr': //ura
			//let data = fs.readFileSync('hr.pdf');
			res.contentType("application/pdf");
			res.send(fs.readFileSync('hr.pdf'));
            break;
        case '/api/tabledata': case '/api/tabledata': //ura
			checkAuthenticated(req, res, () => {
			excel.generateXlsx(res, client, tableData);
			});
            break;
		case '/help/admin': case '/help/admin': //ura
			res.contentType("application/pdf");
			res.send(fs.readFileSync('admin.pdf'));
            break;
        // monitor
        case '/graphql': case '/graphql/':
            return next();
        case '/login': case '/login/':
            return next();
        case '/test': case '/test/':
            return next();
        case '/count': case '/count/':
            return next();
        default:
            checkAuthenticated(req, res, () => {
                //res.sendFile(path.join(__dirname + '/build/index.html'));
				let html=fs.readFileSync(path.join(__dirname + '/build/index.html'), 'utf8');
				html = html.replace("__SERVER_DATA__", getHost);
				res.end(html);
            });
    }
});

const storageConfig = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, uploadFolderPath);
    },
    filename: (req, file, cb) => {
        const fNameNoExt = path.parse(file.originalname).name;
        cb(null, fNameNoExt + '-' + Date.now() + path.extname(file.originalname));
    }
});

app.use(multer({storage:storageConfig}).single("file"));
//app.use(multer({ storage: storageConfig }).array("multi-files", 10));
app.post("/document-control/orders", function (req, res, next) {

    let filedata = req.file;
    if(!filedata)
        res.send("Ошибка при загрузке файла");
    else
        res.send("Файл загружен");
});
app.post("/document-control/for-execution-inbox", function (req, res, next) {

    let filedata = req.file;
    if(!filedata)
        res.send("Ошибка при загрузке файла");
    else
        res.send("Файл загружен");
});


app.post("/get-file", async (req, res) => {
    const { writeFile } = require('fs');
    const { promisify } = require('util');


    let client = require("./config/pgConfig")
    let id = req.body.id
    let result = await client.query(`SELECT * FROM document_files WHERE id = ${id}`)
    res.json({ result: result.rows[0] })
})

app.post("/get-tasks-file", async (req, res) => {
    const { writeFile } = require('fs');
    const { promisify } = require('util');


    let client = require("./config/pgConfig")
    let id = req.body.id
    let result = await client.query(`SELECT * FROM document_tasks_files WHERE id = ${id}`)
    res.json({ result: result.rows[0] })
})

// обработка GET/POST

//// среда тестирования запросов graphql
app.get('/graphql', checkAuthenticated, (req, res, next) => {
    if (req.user.admin) {
        return next();
    }
    //res.sendFile(path.join(__dirname + '/build/index.html'));
	let html=fs.readFileSync(path.join(__dirname + '/build/index.html'), 'utf8');
	html = html.replace("__SERVER_DATA__", getHost);
	res.end(html);
});
//// авторизация, через graphql не работает (не нашел)
app.get('/login', checkNotAuthenticated, (req, res) => {
    //res.sendFile(path.join(__dirname + '/build/index.html'));
	let html=fs.readFileSync(path.join(__dirname + '/build/index.html'), 'utf8');
	html = html.replace("__SERVER_DATA__", getHost);
	res.end(html);
});
app.post('/login', checkNotAuthenticated, (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login'
    })(req, res, next)
});
//// конвой (убрать, было для теста)
app.post('/test', (req, res, next) => {
    console.log(req.body);
    res.send(JSON.stringify({result: true}));
});


(async () => {
    // подключение к БД
    await client.connect();
    // инициализация авторизации
    initializePassport({passport, client});
    // создание graphql сервера (экземпляра)
    const server = new ApolloServer({
        path: constants.graphql.path,
        typeDefs,
        resolvers: resolvers,
        debug: false,
        subscriptions: {
            path: constants.graphql.path,
            onConnect: (connectionParams, webSocket) => {
                console.log('Connected to websocket')
            },
        },
        context: ({req, res, next, connection}) => {
            if (req) {
                //console.log(req.isAuthenticated());
					//const { parse } = require('graphql');
					//let ttt = parse(req.body.query);
					//console.log(ttt);
                return {body: req.body, req, res, next};
            }
            if (connection) {
                return {connection};
            }
        },
    });
    server.applyMiddleware({app, cors: false});
    server.installSubscriptionHandlers(graphQLWebSocket);
    // Start server
    httpsServer.listen(constants.port, constants.host, function () {
        console.log(`|----------------------------------------------------------------------------------------------------------------------|`)
        console.log(`|🚀 Web server started at  : https://${constants.host}:${constants.port}/                                                                |`)
        console.log(`|----------------------------------------------------------------------------------------------------------------------|`)
        console.log(`|🚀 Server           ready at : https://${constants.host}:${constants.port}${constants.graphql.path}                                                      |`)
        console.log(`|🚀 Subscriptions    ready at : wss://${constants.host}:${constants.port}${constants.graphql.path}                                                        |`)
        console.log(`|🚀 Zik-Skud         ready at : ws://${constants.host}:${constants.guard.port}${constants.guard.path}                  |`)
        console.log(`|----------------------------------------------------------------------------------------------------------------------|`)
		//project information
		console.log("HTTP server mode:",app.settings.env);
		//console.log("NodeJS mode:",process.env.NODE_ENV);
		//console.log("Zik-Skud version:",process.env.npm_package_version);
    });
    // upgrade HTTP до WS
    httpsServer.on('upgrade', (request, socket, head) => {
        const {url} = request;
        console.log(request.socket.remoteAddress, new Date(), `REQUEST WS: ${url}`);

        switch (url) {
            case constants.graphql.path:
                console.log('\x1b[35m%s\x1b[0m', '----connect', constants.graphql.path);
                graphQLWebSocket.handleUpgrade(request, socket, head, ws => {
                    graphQLWebSocket.emit('connection', ws)
                })
                break;
            default:
                console.log(request.socket.remoteAddress, new Date(), `REQUEST WS: ${url}, destroy`);
                socket.destroy();
                break;
        }
    });

    //-------------------------------------------------------------------------------------------------------------wss ssl server for SD (not used)
    wss.on('connection', function connection(ws,req,next) {
        console.log("SD wss client connected:", req.url);
        console.log(req.socket.remoteAddress, new Date(), 'open');
        console.log("Total SD wss clients connected:", wss.clients.size);
        skudLogger(debugFileLog, "WS connect event. Remote host connected: " + req.socket.remoteAddress, fs);
        let countPgClient;

        ws.on('message', async function message(msg) {
            console.log("WS message", JSON.parse(msg));
            const payload = JSON.parse(msg);
            if (payload.id && payload.positionId && payload.type=='init') {
                countPgClient = new pg.Client(connectionString);
                countPgClient.connect();
                countPgClient.query('listen document_logs');

                countPgClient.on('notification', async (data) => {
                    const dbPayload = JSON.parse(data.payload);
                    console.log('document_logs insert:', dbPayload);
                    switch (dbPayload.type) {
                        case 'document_logs':
                            console.log('notification: events', dbPayload);
                            if (payload.id == dbPayload.data.user_id) {
                                ws.send(JSON.stringify(dbPayload));
                            };
                            break;
                    }
                });
            };
        });

        ws.on('close', function close() {
            countPgClient.end();
            ws.terminate();
            ws.id = null;
        });
        ws.on('error', (error) => {
            console.log('\x1b[31m%s\x1b[0m', "SD: WebSocket ERROR: " + error);
            skudLogger(debugFileLog, "SD: WebSocket ERROR: " + error, fs);
            ws.close();
        });
    });
    httpsServerSdWs.listen(constants.wss.port, constants.host, function () {
        console.log('Wss server for browser listening on: ' + 'wss://' + constants.host + ':' + constants.wss.port)
    });

    //-----------------------------------------------------------------------------------------------------------------------------------

    sdServerWSConfig.connect.on('connection', function (ws, req, next) {
        console.log("Agent client connected:", req.url);
        console.log(req.socket.remoteAddress, new Date(), 'open');
        console.log("Total agent clients connected:", sdServerWSConfig.connect.clients.size);
        skudLogger(debugFileLog, "WS connect event. Remote host connected: " + req.socket.remoteAddress, fs);

        ws.isAlive = true;
        ws.on('pong', () => { heartbeat(ws) });
        //console.log('this', ws)
        //replicationInterval;
        //console.log('ws',ws)

        let pgClient = new pg.Client(connectionString);
        pgClient.connect();
        console.log('Agent DB client connected for ws client:', req.socket.remoteAddress);

        ws.on('message', async function incoming(message) {
            //skudLogger(debugFileLog,"on message",fs);
            let tmp = JSON.parse(message);
            let notifyIntervalPost;
            console.log('\x1b[31m%s\x1b[0m', req.socket.remoteAddress, new Date(), 'Data received:', ws.id?ws.id:null, tmp.type);

            if (tmp.type == 'testPy' && tmp.data!=null) {
                pgClient.query(`SELECT id, lower(domain_username) as domain_username FROM users WHERE lower(domain_username) = '${tmp.data.toLowerCase()}'`, (err, result) => {
                        if (err) {
                            return console.error('psql error:', err);
                        }
                        if (result.rows[0]?.domain_username.toLowerCase() == tmp.data.toLowerCase()) {
                            ws.username = tmp.data;
                            ws.id = result.rows[0].id;
                            console.log('ws auth:', tmp);
                            clearInterval(notifyIntervalPost);

                            notifyIntervalPost = setInterval(async function post() {
                                if (ws.id) {
                                    await pgClient.query(`select user_id from document_logs where user_id=${ws.id} and is_read=false`,
                                        (err, result) => {
                                            if (err) {
                                                return console.error('error head reply pg query:', err);
                                            }
                                            //console.log("result.rows[0]", result.rows, ws.id, result.rows.length)
                                            if (result.rows.length > 0 && result.rows[0].user_id == ws.id)
                                                ws.send(JSON.stringify({ type: 'notification', data: result.rows.length }));
                                        });
                                    await pgClient.query(`select user_id from document_tasks_logs where user_id=${ws.id} and is_read=false`,
                                        (err, result) => {
                                            if (err) {
                                                return console.error('error head reply pg query:', err);
                                            }
                                            //console.log("result.rows[0]", result.rows, ws.id, result.rows.length)
                                            if (result.rows.length > 0 && result.rows[0].user_id == ws.id)
                                                ws.send(JSON.stringify({ type: 'notification', data: result.rows.length }));
                                        });
                                }
                                else if (!ws.id) clearInterval(notifyIntervalPost)
                            }, tmp.interval * 60000);
                        }
                        else {
                            console.error('not ws auth:', tmp);
                        }
                    });
            }
            else {
                console.log('other');
            };

            if (tmp.type == 'reInterval') {
                let notifyIntervalPost2;
                console.log('reInterval', tmp.interval)
                clearInterval(notifyIntervalPost);
                clearInterval(notifyIntervalPost2)
                notifyIntervalPost2 = setInterval(async function post() {
                    if (ws.id) {
                        await pgClient.query(`select user_id from document_logs where user_id=${ws.id} and is_read=false`,
                            (err, result) => {
                                if (err) {
                                    return console.error('error head reply pg query:', err);
                                }
                                //console.log("result.rows[0]", result.rows, ws.id, result.rows.length)
                                if (result.rows.length > 0 && result.rows[0].user_id == ws.id)
                                    ws.send(JSON.stringify({ type: 'notification', data: result.rows.length }));
                            });
                        await pgClient.query(`select user_id from document_tasks_logs where user_id=${ws.id} and is_read=false`,
                            (err, result) => {
                                if (err) {
                                    return console.error('error head reply pg query:', err);
                                }
                                //console.log("result.rows[0]", result.rows, ws.id, result.rows.length)
                                if (result.rows.length > 0 && result.rows[0].user_id == ws.id)
                                    ws.send(JSON.stringify({ type: 'notification', data: result.rows.length }));
                            });
                    }
                    else if (!ws.id) clearInterval(notifyIntervalPost2)
                }, tmp.interval * 60000);
            };

        });

        ws.on('close', function close() {
            sdServerWSConfig.inProcessing = false;
            console.log(req.socket.remoteAddress, new Date(), 'Replication: disconnected');
            skudLogger(debugFileLog, "Replication: WS disconnect event. Remote host disconnected: " + req.socket.remoteAddress, fs);
            sdServerWSConfig.isConnect = false;

            pgClient.end();
            ws.terminate();
            ws.id = null;
        });
        ws.on('error', (error) => {
            replicationWSConfig.inProcessing = false;
            console.log('\x1b[31m%s\x1b[0m', "Replication: WebSocket ERROR: " + error);
            skudLogger(debugFileLog, "Replication: WebSocket ERROR: " + error, fs);

            pgClient.end();
            ws.terminate();
            ws.id = null;
        });

        //manage replication & tests
        process.stdin.on('keypress', async (str, key) => {
            if (ws.readyState === WebSocket.OPEN) {
                switch (key.name) {
                    case '4':

                        break;
                };
            };
        });

    });


    //PG error handling
    client.on('error', async (e) => {
        if (e.code == 'ECONNRESET') {
            skudLogger(debugFileLog, "PostgreSql ECONNRESET: Connection reset from server DB. Error: " + e, fs);
        }
    });

    client.on('error', async (e) => {
        skudLogger(debugFileLog, "PostgreSql ERROR: " + e, fs);
    })


})();

const heartbeat = (ws) => {  //ping-pong for ws
    ws.isAlive = true;
    //console.log('heartbeat');
    //console.log('heartbeat', this.clients.forEach(async function each(ws) { console.log('each',ws.isAlive)}))
};

const testPing = () => {  //ping-pong for ws
    //console.log('Ping sent');
};


const replicationInterval = setInterval(function ping() {
    sdServerWSConfig.connect.clients.forEach(async function each(ws) {
        if (ws.isAlive === false) {
            ws.terminate();
            console.log('terminated ws')
            return;
        };
        ws.isAlive = false;
        ws.ping(testPing);
    });
}, 8500);

//App tracing for warnings and errors
process.on('warning', (e) => {
	console.warn("Warning:",e.stack);
	skudLogger(debugFileLog,"NodeJS Warning: "+e.stack,fs);
});
process.on('error', (e) => {
    console.error("Process.on error - error:", e.stack);
	skudLogger(debugFileLog,"NodeJS Error: "+e.stack,fs);
});
process.on('exit', (code) => {
	console.warn("Exit code: ",code);
	skudLogger(debugFileLog,"NodeJS Exit App event. Exit code: "+code,fs);
});
process.on('uncaughtException', (e) => {
	console.warn("Error, uncaughtException: ",e.stack);
	skudLogger(debugFileLog,"UncaughtException event. Error: "+e,fs);
});