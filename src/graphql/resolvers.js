const { GraphQLScalarType, GraphQLObjectType } = require("graphql");
const GraphQLJSON = require("graphql-type-json");
const Bigint = require("graphql-type-bigint");

const bcryptjs = require("bcryptjs");

const client = require("../../config/pgConfig");
const tables = require("./tables");
const DataLoader = require("dataloader");
const { now } = require("../core/functions");
const { queryParseJson } = require("../core/functions");

const { publish } = require("./graphqlFunctions");
const { pubSub } = require("../../config/graphqlPubSubConfig");

const testCache = [10, 20, 30];

const resolvers = {
	Bigint: new GraphQLObjectType({
		name: "Bigint",
		fields: {
			numberField: {
				type: Bigint,
				// this would throw an error with the GraphQLInt
				resolve: () => Number.MAX_SAFE_INTEGER,
			},
		},
	}),
	JSON: GraphQLJSON,
	DateTime: new GraphQLScalarType({
		name: "DateTime",
		description: "A date and time, represented as an ISO-8601 string",
		serialize: (value) => {
			return now(value);
		},
		parseValue: (value) => {
			return new Date(value);
		},
		parseLiteral: (ast) => {
			return new Date(ast.value);
		},
	}),
	Test: {
		async test1(parent) {
			return { one: 1, two: 2 };
		},
	},
	Test1: {
		test2(parent) {
			const authorLoader = new DataLoader((keys) => {
				const result = keys.map((authorId) => {
					return testCache[authorId];
				});

				return Promise.resolve([{ one: result[0], two: 2 }]);
			});
			return authorLoader.load(parent.one);
		},
	},
	Query: {
		test: async (parent, args, context) => {
			return [
				{ one: 1, two: 1 },
				{ one: 2, two: 2 },
				{ one: 3, two: 3 },
			];
		},
		test1: async (parent, args, context) => {
			return { one: 1, two: 2 };
		},
		test2: async (parent, args, context) => {
			return { one: 1, two: 2 };
		},
		test3: async (parent, args, context) => {
			const res = await client.query(
				`select id, routes from document_routes as Test3`
			);
			console.log(res);
			return res.rows;
		},

		// global
		dateTime: async (parent, args, { req }) => {
			const res = await client.query(`SELECT NOW() AS timestamp`);
			return res.rows[0].timestamp;
		},
		authMe: async (parent, args, { req }) => {
			if (req) {
				if (req.user) {
					const request = await client.query(`SELECT *,
                        array(select name from positions where id = any(array[(
                        select array(select json_array_elements_text(t.positions)::bigint
                        from users t where id=${req.user.id}) from users where id=${req.user.id})])) as position_names,

                        (select accesses from positions where id = any(array[(
                        select array(select json_array_elements_text(t.positions)::bigint
                        from users t where id=${req.user.id}) from users where id=${req.user.id})])) as position_accesses
                        
                        FROM users where id=${req.user.id}`);
					return [
						{
							...request.rows[0],
							password: "",
						},
					];
				}
			}
			return [];
		},
		data_custom: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			const res = await client.query(dbQuery.data_custom);
			return res.rows;
		},
		data_agreement_list: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			const res = await client.query(dbQuery.data_agreement_list);
			return res.rows;
		},
		data_agreement_list_production: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			const res = await client.query(dbQuery.data_agreement_list_production);
			return res.rows;
		},
		data_agreement_list_internal_needs: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			const res = await client.query(
				dbQuery.data_agreement_list_internal_needs
			);
			return res.rows;
		},
		documents: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			const res = await client.query(dbQuery.documents);
			return res.rows;
		},
		departament_dictionary: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			const res = await client.query(dbQuery.departament_dictionary);
			return res.rows;
		},
		departament_relationship: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			const res = await client.query(dbQuery.departament_relationship);
			return res.rows;
		},

		document_statuses: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			// console.log(dbQuery);
			const res = await client.query(dbQuery.document_statuses);
			return res.rows;
		},

		forms: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			const res = await client.query(dbQuery.forms);
			return res.rows;
		},

		document_routes: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			// console.log(dbQuery);
			const res = await client.query(dbQuery.document_routes);
			return res.rows;
		},

		document_tasks: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			// console.log(dbQuery);
			const res = await client.query(dbQuery.document_tasks);
			return res.rows;
		},

		document_comments: async (parent, args, context) => {
			//console.log('query comments args', args)
			//console.log('query comments conxtext variables', context.body.variables)
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			const res = await client.query(dbQuery.document_comments);
			return res.rows;
		},
		document_signatures: async (parent, args, context) => {
			//console.log('query signatures args', args)
			//console.log('query signatures conxtext variables', context.body.variables)
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			const res = await client.query(dbQuery.document_signatures);
			return res.rows;
		},
		document_logs: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			const res = await client.query(dbQuery.document_logs);
			return res.rows;
		},
		document_tasks_logs: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			const res = await client.query(dbQuery.document_tasks_logs);
			return res.rows;
		},

		files: async (parent, args) => {
			let sql = `
                SELECT
                    *
                FROM
                    document_files
                WHERE document_id = ${args.files.document_id}
            `;
			let res = await client.query(sql);
			// console.log(res.rows)
			return res.rows;
		},

		task_files: async (parent, args) => {
			let sql = `
            (
                select filename, data_file
                    from document_files
                        where document_id = ${args.id}
                )
                union all
                (
                SELECT filename, data_file
                    FROM public.document_tasks_files
                        WHERE task_id in  (select id 
                                                FROM public.document_tasks 
                                                    WHERE document_id=${args.id}) and is_add_to_document=true
                )
            `;
			let res = await client.query(sql);
			console.log(sql);
			return res.rows;
		},

		users: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			const res = await client.query(
				dbQuery.users.replace("password", `'' AS password`)
			);
			return res.rows;
		},
		positions: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			const res = await client.query(dbQuery.positions);
			return res.rows;
		},
		user_roles: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			const res = await client.query(dbQuery.user_roles);
			return res.rows;
		},

		sessions: async (parent, args, context) => {
			let [dbQuery] = queryParseJson({
				query: context.body.query,
				variables: args ? args : context.body.variables,
				tables,
			});
			const res = await client.query(dbQuery.sessions);
			return res.rows;
		},
	},
	Mutation: {
		// global
		login: async (parent, args) => {
			let req = await client.query(
				`SELECT id, username, password FROM users WHERE username = '${args.user.username}'`
			);
			if (req.rows.length == 0) {
				throw new Error("Неверно введен логин!");
			}
			let user = req.rows[0];
			if (await bcryptjs.compare(args.user.password, user.password)) {
				return { username: args.user.username };
			} else {
				throw new Error("Неверно введен пароль!");
			}
		},

		insertUser: async (parent, args) => {
			const password = await bcryptjs.hash(args.user.password, 10);
			await client.query(
				`SELECT * FROM user_insert('${JSON.stringify({
					...args.user,
					password,
				})}')`
			);
			publish("users", client);
			return { type: "success", message: "Успешно создано!" };
		},
		updateUser: async (parent, args) => {
			const password =
				args.user.password === ""
					? ""
					: await bcryptjs.hash(args.user.password, 10);
			await client.query(
				`SELECT * FROM user_update('${JSON.stringify({
					...args.user,
					password,
				})}')`
			);
			publish("users", client);
			publish("authMe", client);
			return { type: "success", message: "Успешно изменено!" };
		},
		deleteUser: async (parent, args) => {
			await client.query(
				`SELECT * FROM user_delete('${JSON.stringify(args.user)}')`
			);
			publish("users", client);
			publish("authMe", client);
			return { type: "success", message: "Успешно удалено!" };
		},
		updatePassword: async (parent, args) => {
			const mytmp = {
				id: args.id,
				username: args.username,
				pwd1: args.password,
			};

			const res = await client.query(
				`SELECT id, username, password FROM users WHERE username = '${mytmp.username}'`
			);
			const user = res.rows.length !== 0 ? res.rows[0] : null;

			//if (await bcryptjs.compare(mytmp.pwd1, user.password)) {
			const password2 =
				mytmp.pwd1 === "" ? "" : await bcryptjs.hash(mytmp.pwd1, 10);
			await client.query(
				`update users set password = '${password2}' where username = '${mytmp.username}'`
			);
			//}
			//else {
			//throw new Error('Пароли не совпадают!');};
		},

		insertPosition: async (parent, args) => {
			await client.query(
				`SELECT * FROM admin_document_position_insert('${JSON.stringify(
					args.positions
				)}')`
			);
			publish("positions", client);
			return { type: "success", message: "Успешно создано" };
		},
		updatePosition: async (parent, args) => {
			await client.query(
				`SELECT * FROM admin_document_position_update('${JSON.stringify(
					args.positions
				)}')`
			);
			publish("positions", client);
			return { type: "success", message: "Успешно изменено" };
		},
		deletePosition: async (parent, args) => {
			await client.query(
				`SELECT * FROM admin_document_position_delete('${JSON.stringify(
					args.positions
				)}')`
			);
			publish("positions", client);
			return { type: "success", message: "Успешно удалено" };
		},
		// -----Documents Tasks -------
		insertDocumentTasks: async (parent, args) => {
			await client.query(
				`SELECT * FROM document_tasks_insert('${JSON.stringify(
					args.document_tasks
				)}')`
			);
			publish("document_tasks", client);
			return { type: "success", message: "Успешно создано" };
		},
		updateDocumentTasks: async (parent, args) => {
			await client.query(
				`SELECT * FROM document_tasks_update('${JSON.stringify(
					args.document_tasks
				)}')`
			);
			publish("document_tasks", client);
			return { type: "success", message: "Успешно создано" };
		},
		// -----Documents mutatuions-----
		insertDocument: async (parent, args) => {
			await client.query(
				`SELECT * FROM document_insert('${JSON.stringify(args.document)}')`
			);
			publish("documents", client);
			publish("document_logs", client);
			return { type: "success", message: "Успешно создано" };
		},
		updateDocument: async (parent, args) => {
			await client.query(
				`SELECT * FROM document_update('${JSON.stringify(args.document)}')`
			);
			publish("documents", client);
			publish("document_logs", client);
			return { type: "success", message: "Документ изменен" };
		},
		deleteDocument: async (parent, args) => {
			await client.query(
				`SELECT * FROM document_delete('${JSON.stringify(args.document)}')`
			);
			publish("documents", client);
			return { type: "success", message: "Успешно удалено!" };
		},
		setIsReadTrue: async (parent, args) => {
			await client.query(
				`SELECT * FROM document_set_is_read_true('${JSON.stringify(
					args.document
				)}')`
			);
			publish("documents", client);
			publish("document_logs", client);
			return {};
		},
		setTaskIsReadTrue: async (parent, args) => {
			await client.query(
				`SELECT * FROM  document_tasks_set_is_read_true('${JSON.stringify(
					args.task
				)}')`
			);
			publish("tasks", client);
			publish("document_tasks_logs", client);
			return {};
		},
		// -----Comments mutatuions-----
		insertComment: async (parent, args) => {
			await client.query(
				`SELECT * FROM document_comment_insert('${JSON.stringify(
					args.comment
				)}')`
			);
			publish("document_comments", client);
			return { type: "success", message: "Успешно создано" };
		},
		updateComment: async (parent, args) => {
			//console.log(args)
			await client.query(
				`SELECT * FROM document_update('${JSON.stringify(args.comment)}')`
			);
			publish("document_comments", client);
			return { type: "success", message: "Документ изменен" };
		},
		deleteComment: async (parent, args) => {
			await client.query(
				`SELECT * FROM document_delete('${JSON.stringify(args.comment)}')`
			);
			publish("document_comments", client);
			return { type: "success", message: "Успешно удалено!" };
		},
		// -----Signatures mutatuions-----
		insertSignature: async (parent, args) => {
			await client.query(
				`SELECT * FROM document_signature_insert('${JSON.stringify(
					args.signature
				)}')`
			);
			publish("document_signatures", client);
			return { type: "success", message: "Успешно создано" };
		},
		deleteSignature: async (parent, args) => {
			await client.query(
				`SELECT * FROM document_signature_delete(('${JSON.stringify(
					args.signature
				)}')`
			);
			publish("document_signatures", client);
			return { type: "success", message: "Успешно изменено" };
		},
		// -----Files mutatuions-----
		deleteFile: async (parent, args) => {
			await client.query(
				`SELECT * FROM files_delete('${JSON.stringify(args.document_files)}')`
			);
			publish("documents", client);
			publish("files", client);
			return { type: "success", message: "Успешно удалено" };
		},

		setAgreement: async (parent, args) => {
			// console.log("ARGS", JSON.stringify(args));
			const sql = `SELECT * FROM agreements_set('${JSON.stringify(
				args.agreement
			)}')`;
			//console.log(sql);
			await client.query(
				`SELECT * FROM agreement_set('${JSON.stringify(args.agreement)}')`
			);
			publish("agreement", client);
			return { type: "success", message: "Документ отправлен в ООПЗ" };
		},

		//Document statuses
		insertDocumentStatus: async (parent, args) => {
			await client.query(
				`SELECT * FROM admin_document_status_insert('${JSON.stringify(
					args.document_statuses
				)}')`
			);
			publish("document_statuses", client);
			return { type: "success", message: "Успешно" };
		},
		updateDocumentStatus: async (parent, args) => {
			await client.query(
				`SELECT * FROM admin_document_status_update('${JSON.stringify(
					args.document_statuses
				)}')`
			);
			publish("document_statuses", client);
			return { type: "success", message: "Успешно" };
		},
		deleteDocumentStatus: async (parent, args) => {
			await client.query(
				`SELECT * FROM admin_document_status_delete('${JSON.stringify(
					args.document_statuses
				)}')`
			);
			publish("document_statuses", client);
			return { type: "success", message: "Успешно" };
		},
		//Forms settings
		insertForm: async (parent, args) => {
			await client.query(
				`SELECT * FROM admin_form_settings_insert('${JSON.stringify(
					args.forms
				)}')`
			);
			publish("forms", client);
			return { type: "success", message: "Успешно" };
		},
		updateForm: async (parent, args) => {
			await client.query(
				`SELECT * FROM admin_form_settings_update('${JSON.stringify(
					args.forms
				)}')`
			);
			publish("forms", client);
			return { type: "success", message: "Успешно" };
		},
		deleteForm: async (parent, args) => {
			await client.query(
				`SELECT * FROM admin_form_settings_delete('${JSON.stringify(
					args.forms
				)}')`
			);
			publish("forms", client);
			return { type: "success", message: "Успешно" };
		},
		//Document routes
		insertDocumentRoute: async (parent, args) => {
			await client.query(
				`SELECT * FROM admin_document_route_insert('${JSON.stringify(
					args.document_routes
				)}')`
			);
			publish("document_routes", client);
			return { type: "success", message: "Успешно сохранено" };
		},
		updateDocumentRoute: async (parent, args) => {
			await client.query(
				`SELECT * FROM admin_document_route_update('${JSON.stringify(
					args.document_routes
				)}')`
			);
			publish("document_routes", client);
			return { type: "success", message: "Успешно сохранено" };
		},
		deleteDocumentRoute: async (parent, args) => {
			await client.query(
				`SELECT * FROM admin_document_route_delete('${JSON.stringify(
					args.document_routes
				)}')`
			);
			publish("document_routes", client);
			return { type: "success", message: "Успешно сохранено" };
		},
		set_is_add_to_document: async (parent, args) => {
			await client.query(
				`UPDATE document_tasks_files SET is_add_to_document=${args.state} where id=${args.ID}`
			);
			return { type: "success", message: "Изменен документ" };
		},
	},
	Subscription: {
		authMe: {
			subscribe: (parent, args, context) => {
				return pubSub.asyncIterator([
					"authMe$query$SELECT * FROM users WHERE id = (SELECT min(id) FROM users)",
				]);
			},
		},
		users: {
			subscribe: (parent, args, context) => {
				let [dbQuery] = queryParseJson({
					query: context.connection.query,
					variables: args,
					tables,
				});
				return pubSub.asyncIterator([
					`users$query$${dbQuery.users.replace("password", `'' AS password`)}`,
				]);
			},
		},
		sessions: {
			subscribe: (parent, args, context) => {
				let [dbQuery] = queryParseJson({
					query: context.connection.query,
					variables: args,
					tables,
				});
				return pubSub.asyncIterator([`sessions$query$${dbQuery.sessions}`]);
			},
		},
		positions: {
			subscribe: (parent, args, context) => {
				let [dbQuery] = queryParseJson({
					query: context.connection.query,
					variables: args,
					tables,
				});
				return pubSub.asyncIterator([`positions$query$${dbQuery.positions}`]);
			},
		},
		documents: {
			subscribe: (parent, args, context) => {
				let [dbQuery] = queryParseJson({
					query: context.connection.query,
					variables: args,
					tables,
				});
				return pubSub.asyncIterator([`documents$query$${dbQuery.documents}`]);
			},
		},
		document_tasks: {
			subscribe: (parent, args, context) => {
				let [dbQuery] = queryParseJson({
					query: context.connection.query,
					variables: args,
					tables,
				});
				return pubSub.asyncIterator([
					`document_tasks$query$${dbQuery.document_tasks}`,
				]);
			},
		},

		document_statuses: {
			subscribe: (parent, args, context) => {
				let [dbQuery] = queryParseJson({
					query: context.connection.query,
					variables: args,
					tables,
				});
				return pubSub.asyncIterator([
					`document_statuses$query$${dbQuery.document_statuses}`,
				]);
			},
		},

		forms: {
			subscribe: (parent, args, context) => {
				let [dbQuery] = queryParseJson({
					query: context.connection.query,
					variables: args,
					tables,
				});
				return pubSub.asyncIterator([`forms$query$${dbQuery.forms}`]);
			},
		},

		document_routes: {
			subscribe: (parent, args, context) => {
				let [dbQuery] = queryParseJson({
					query: context.connection.query,
					variables: args,
					tables,
				});
				return pubSub.asyncIterator([
					`document_routes$query$${dbQuery.document_routes}`,
				]);
			},
		},
		document_logs: {
			subscribe: (parent, args, context) => {
				let [dbQuery] = queryParseJson({
					query: context.connection.query,
					variables: args,
					tables,
				});
				return pubSub.asyncIterator([
					`document_logs$query$${dbQuery.document_logs}`,
				]);
			},
		},
		document_tasks_logs: {
			subscribe: (parent, args, context) => {
				let [dbQuery] = queryParseJson({
					query: context.connection.query,
					variables: args,
					tables,
				});
				return pubSub.asyncIterator([
					`document_tasks_logs$query$${dbQuery.document_tasks_logs}`,
				]);
			},
		},
	},
};

module.exports = {
	resolvers,
};

let sss = {
	_where: {
		AND: [
			{
				OR: [
					{
						timestamp: ">10",
					},
				],
			},
			{ AND: [] },
		],
	},
};
