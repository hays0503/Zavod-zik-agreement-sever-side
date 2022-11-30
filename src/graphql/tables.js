const tables = {
	users: {
		fields: {
			id: "Int",
			username: "character varying",
			password: "character varying",
			admin: "boolean",
			role_id: "bigint",
			accesses: "json",
			positions: "json",
			domain_username: "character varying",
			fio: "character varying",
			email: "character varying",
			department_relationship: `(SELECT row_to_json(j.*)
                                            AS    department_relationship
                                            FROM
                                        (SELECT $*$ 
                                            FROM  department_relationship 
                                            AS
                                        $Q++$
                                        WHERE id_user = $Q$.id) as j)`,
		},
		where: {
			id: "id $*$",
			username: "username $*$",
			password: "password $*$",
			admin: "admin $*$",
			accesses: "accesses $*$",
		},
		comment: "user",
	},
	positions: {
		fields: {
			id: "Int",
			name: "character varying",
			accesses: "json",
			is_boss: "boolean",
			is_vice_director: "boolean",
			is_user: "boolean",
		},
		where: {
			id: "id $*$",
			name: "username $*$",
			accesses: "accesses $*$",
			id_depart: "id_depart $*$",
			is_boss: "is_boss $*$",
			is_vice_director: "is_vice_director $*$",
			is_user: "is_user $*$",
		},
		comment: "positions",
	},
	user_roles: {
		fields: {
			id: "Int",
			name: "character varying",
		},
		where: {
			id: "id $*$",
			name: "name $*$",
		},
		comment: "user",
	},
	application: {
		fields: {
			platform_version: "character varying",
			database_version: "character varying",
		},
		where: {},
		comment: "application",
	},
	sessions: {
		fields: {
			sid: "text",
			sess: "text",
			expire: "timestamp without time zone",
		},
		where: { sid: "sid $*$", sess: "sess $*$", expire: "expire $*$" },
		comment: "session",
	},
	document_logs: {
		fields: {
			id: "Int",
			document_id: "bigint",
			is_read: "boolean",
			user_id: "bigint",
			type: "Bigint",
		},
		where: {
			id: "id $*$",
			document_id: "document_id $*$",
			is_read: "is_read $*$",
			user_id: "user_id $*$",
			type: "type $*$",
		},
	},
	document_tasks_logs: {
		fields: {
			id: "Int",
			task_id: "bigint",
			is_read: "boolean",
			user_id: "bigint",
			type: "Bigint",
		},
		where: {
			id: "id $*$",
			task_id: "task_id $*$",
			is_read: "is_read $*$",
			user_id: "user_id $*$",
			type: "type $*$",
		},
	},
	documents: {
		fields: {
			id: "Int",
			title: "character varying",
			reason: "character varying",
			subject: "character varying",
			supllier: "character varying",
			status_id: "bigint",
			document_statuses:
				"(SELECT row_to_json(j.*) AS document_statuses FROM (SELECT $*$ FROM document_statuses AS $Q++$ WHERE id = $Q$.status_id) as j)",
			route_id:
				"(SELECT row_to_json(j.*) AS route_id FROM (SELECT $*$ FROM document_routes AS $Q++$ WHERE id = $Q$.route_id) as j)",
			comments:
				"ARRAY(SELECT row_to_json(j.*) FROM (SELECT $*$ FROM document_comments AS $Q++$ WHERE document_id IN (SELECT id FROM documents WHERE id = $Q$.id) $WHERE$ $ORDER_BY$) as j ) AS comments ",
			signatures:
				"ARRAY(SELECT row_to_json(j.*) FROM (SELECT $*$ FROM document_signatures AS $Q++$ WHERE document_id IN (SELECT id FROM documents WHERE id = $Q$.id) $WHERE$ $ORDER_BY$) as j ) AS signatures ",
			files:
				"ARRAY(SELECT row_to_json(j.*) FROM (SELECT $*$ FROM document_files AS $Q++$ WHERE filename is not null and document_id IN (SELECT id FROM documents WHERE id = $Q$.id) $WHERE$ $ORDER_BY$) as j ) AS files ",
			document_logs:
				"ARRAY(SELECT row_to_json(j.*) FROM (SELECT $*$ FROM document_logs AS $Q++$ WHERE document_id IN (SELECT id FROM documents WHERE id = $Q$.id) and is_read=false $ORDER_BY$) as j ) AS document_logs ",
			data_agreement_list:
				"ARRAY(SELECT row_to_json(j.*) FROM (SELECT $*$ FROM data_agreement_list AS $Q++$ WHERE document_id IN (SELECT id FROM documents WHERE id = $Q$.id) $WHERE$ $ORDER_BY$) as j ) AS data_agreement_list ",
			data_one:
				"ARRAY(SELECT row_to_json(j.*) FROM (SELECT $*$ FROM data_one AS $Q++$ WHERE document_id IN (SELECT id FROM documents WHERE id = $Q$.id) $WHERE$ $ORDER_BY$) as j ) AS data_one ",
			data_agreement_list_production:
				"ARRAY(SELECT row_to_json(j.*) FROM (SELECT $*$ FROM data_agreement_list_production AS $Q++$ WHERE document_id IN (SELECT id FROM documents WHERE id = $Q$.id) $WHERE$ $ORDER_BY$) as j ) AS data_agreement_list_production ",
			data_agreement_list_internal_needs:
				"ARRAY(SELECT row_to_json(j.*) FROM (SELECT $*$ FROM data_agreement_list_internal_needs AS $Q++$ WHERE document_id IN (SELECT id FROM documents WHERE id = $Q$.id) $WHERE$ $ORDER_BY$) as j ) AS data_agreement_list_internal_needs ",
			data_custom:
				"ARRAY(SELECT row_to_json(j.*) FROM (SELECT $*$ FROM data_custom AS $Q++$ WHERE document_id IN (SELECT id FROM documents WHERE id = $Q$.id) $WHERE$ $ORDER_BY$) as j ) AS data_custom ",
			document_tasks:
				"ARRAY(SELECT row_to_json(j.*) FROM (SELECT $*$ FROM document_tasks AS $Q++$ WHERE document_id IN (SELECT id FROM documents WHERE id = $Q$.id) $WHERE$ $ORDER_BY$) as j ) AS document_tasks",
			user_id: "bigint",
			username: "character varying",
			position: "character varying",
			fio: "character varying",
			date_created: "timestamp without time zone",
			date_modified: "timestamp without time zone",
			step: "bigint",
		},
		where: {
			id: "id $*$",
			title: "title $*$",
			status_id: "status_id $*$",
			route_id: "route_id $*$",
			user_id: "user_id $*$",
			step: "step $*$",
			date_created: "date_created $*$",
			date_modified: "date_modified $*$",
			is_read: "is_read $*$",
			positions:
				"exists (select id from (select id, json_array_elements(route_data) as elem from documents) as docelem where(elem->> 'positionId'):: Int = any(array[$*$]))",
			approved_by_me:
				"id in(select document_id from document_signatures where user_id=$*$)",
			documents_for_receiver:
				"id in(select document_id from document_tasks where user_id_receiver=$*$)",
			task_for_document:
				"id in(select document_id from document_tasks where user_id_receiver=$*$)",
		},
	},
	department_dictionary: {
		fields: {
			id: "Int",
			department_name: "character varying",
		},
		where: {
			id: "id $*$",
			department_name: "department_name $*$",
		},
	},
	department_relationship: {
		fields: {
			id_user: "bigint",
			id_department: "bigint",
			is_boss: "boolean",
			is_vice_director: "boolean",
			is_user: "boolean",
			user: "(SELECT row_to_json(j.*) AS user FROM (SELECT $*$ FROM users AS $Q++$ WHERE id = $Q$.id_user) as j) as user",
			department:
				"(SELECT row_to_json(j.*) AS department FROM (SELECT $*$ FROM department_dictionary AS $Q++$ WHERE id = $Q$.id_department) as j)",
		},
		where: {
			id_user: "id_user $*$",
			id_department: "id_department $*$",
			is_boss: "is_boss $*$",
			is_vice_director: "is_vice_director $*$",
			is_user: "is_user $*$",
		},
	},
	//"documents_for_receiver":"id in(select document_id from document_tasks where user_id_receiver=$*$) and exists(select id from document_tasks where user_id_receiver=$*$)"
	document_tasks: {
		fields: {
			id: "Int",
			document_id: "bigint",
			status: "bigint",
			task_statuses:
				"(SELECT row_to_json(j.*) AS task_statuses FROM (SELECT $*$ FROM task_statuses AS $Q++$ WHERE id = $Q$.status) as j)",
			is_cancelled: "boolean",
			note: "character varying",
			deadline: "character varying",
			document_tasks_logs:
				"ARRAY(SELECT row_to_json(j.*) FROM (SELECT $*$ FROM document_tasks_logs AS $Q++$ WHERE task_id IN (SELECT id FROM document_tasks WHERE id = $Q$.id) and is_read=false $ORDER_BY$) as j ) AS document_tasks_logs ",
			date_created: "timestamp without time zone",
			user_id_created: "bigint",
			fio_created: "character varying",
			user_id_receiver: "bigint",
			fio_receiver: "character varying",
			route_id: "bigint",
			document_options: "json",
			task_files: "bigint",
			document_tasks_files:
				"ARRAY(SELECT row_to_json(j.*) FROM (SELECT $*$ FROM document_tasks_files AS $Q++$ WHERE filename is not null and task_id IN (SELECT id FROM document_tasks WHERE id = $Q$.id) $WHERE$ $ORDER_BY$) as j ) AS document_tasks_files",
			report: "character varying",
			document_tasks_id_file: "bigint",
			// "document":"ARRAY(SELECT row_to_json(m.*) FROM(select d.title, d.id from document_tasks t join documents d on t.document_id = d.id where d.id=301) m) as document"
		},
		where: {
			id: "id $*$",
			document_id: "document_id $*$",
			is_cancelled: "is_cancelled $*$",
			date_created: "date_created $*$",
			user_id_created: "user_id_created $*$",
			user_id_receiver: "user_id_receiver $*$",
		},
	},
	data_custom: {
		fields: {
			id: "Int",
			document_id: "bigint",
			subject: "character varying",
			remark: "character varying",
			custom_area: "json",
		},
		where: {
			id: "id $*$",
			document_id: "document_id $*$",
			subject: "subject $*$",
			reason: "reason $*$",
		},
	},
	data_agreement_list_production: {
		fields: {
			id: "Int",
			document_id: "bigint",
			subject: "character varying",
			price: "bigint",
			currency: "character varying",
			executor_name_division: "character varying",
			executor_phone_number: "bigint",
			counteragent_contacts: "character_varying",
		},
		where: {
			id: "id $*$",
			document_id: "document_id $*$",
			subject: "subject $*$",
			price: "price $*$",
			currency: "currency $*$",
			executor_name_division: "executor_name_division $*$",
			executor_phone_number: "executor_phone_number $*$",
			counteragent_contacts: "counteragent_contacts $*$",
		},
	},
	data_one: {
		fields: {
			id: "Int",
			document_id: "bigint",
			price: "bigint",
			supllier: "bigint",
			subject: "character varying",
		},
		where: {
			id: "id $*$",
			document_id: "document_id $*$",
			price: "price $*$",
			supllier: "supllier $*$",
			subject: "subject $*$",
		},
	},
	data_agreement_list: {
		fields: {
			id: "Int",
			document_id: "bigint",
			price: "bigint",
			subject: "character varying",

			currency_price: "character varying",
			executor_name_division: "character varying",
			sider_signatures_date: "character varying",
			received_from_counteragent_date: "character varying",
		},
		where: {
			id: "id $*$",
			document_id: "document_id $*$",
			price: "price $*$",
			subject: "subject $*$",

			currency_price: "currency_price $*$",
			executor_name_division: "executor_name_division $*$",
			sider_signatures_date: "sider_signatures_date $*$",
			received_from_counteragent_date: "received_from_counteragent_date $*$",
		},
	},
	data_agreement_list_internal_needs: {
		fields: {
			id: "Int",
			document_id: "bigint",
			subject: "character varying",
			price: "bigint",
			currency: "character varying",
			executor_name_division: "character varying",
			executor_phone_number: "bigint",
			counteragent_contacts: "character_varying",
		},
		where: {
			id: "id $*$",
			document_id: "document_id $*$",
			subject: "subject $*$",
			price: "price $*$",
			currency: "currency $*$",
			executor_name_division: "executor_name_division $*$",
			executor_phone_number: "executor_phone_number $*$",
			counteragent_contacts: "counteragent_contacts $*$",
		},
	},
	document_routes: {
		fields: {
			id: "Int",
			name: "character varying",
			routes: "json",
			status_in_process: "bigint",
			status_cancelled: "bigint",
			status_finished: "bigint",
		},
		where: {
			id: "id $*$",
			name: "name $*$",
			routes: "routes $*$",
		},
	},
	document_statuses: {
		fields: {
			id: "Int",
			name: "character varying",
		},
		where: {
			id: "id $*$",
			name: "name $*$",
		},
	},
	task_statuses: {
		fields: {
			id: "Int",
			name: "character varying",
		},
		where: {
			id: "id $*$",
			name: "name $*$",
		},
	},
	forms: {
		fields: {
			id: "Int",
			name: "character varying",
			route: "bigint",
			settings: "json",
		},
		where: {
			id: "id $*$",
			name: "name $*$",
		},
	},
	document_agreeting: {
		fields: {
			document_id: "bigint",
			document_user: "bigint",
		},
		where: {
			document_id: "bigint",
		},
	},
	document_comments: {
		fields: {
			id: "Int",
			document_id: "bigint",
			comment: "character varying",
			user_id: "bigint",
			username: "character varying",
			position: "character varying",
			fio: "character varying",
			date: "timestamp without time zone",
		},
		where: {
			document_id: "document_id $*$",
			user_id: "user_id $*$",
		},
	},
	document_signatures: {
		fields: {
			id: "Int",
			document_id: "bigint",
			user_id: "bigint",
			username: "character varying",
			position: "character varying",
			fio: "character varying",
			date_signature: "timestamp without time zone",
		},
		where: {
			document_id: "document_id $*$",
			user_id: "user_id $*$",
		},
	},
};

module.exports = tables;
