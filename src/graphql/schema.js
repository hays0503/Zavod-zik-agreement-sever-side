const { gql } = require("apollo-server-express");

let typeDefs = gql`
    scalar JSON
    scalar Bigint
    scalar DateTime
    type Status {
        type: String
        message: String
    }

    type Role {
        id: ID
        name: String
    }

    type User {
        id: ID
        username: String
        password: String
        admin: Boolean
        role_id: Bigint
        accesses: JSON
        positions: JSON
        position_names: JSON
        position_accesses: JSON
        domain_username: String
        fio: String
        email: String
        departament_relationship: DepartamentRelationship

        boss_position_name:String
    }

    type Position {
        id: ID
        name: String
        accesses: JSON
    }
	type Application {
        platform_version: String
        database_version: String
    }
    type Session {
        sid: String!
        sess: String
        expire: DateTime
    }
    type Test {
        one: Int
        two: Int
        test1: Test1
    }
    type Test1 {
        one: Int
        two: Int
        test2: Test2
    }
    type Test2 {
        one: Int
        two: Int
    }
    type Test3 {
        id: Bigint
        routes: String
    }

    type Agreement {
        document_id: Bigint
        document_user: Bigint
    }

    type DocumentStatuses {
        id: ID
        name: String
    }

    type TaskStatuses{
        id: ID
        name: String
    }

    type DocumentRoutes{
        id: ID
        name: String
        status_in_process: Bigint
        status_cancelled: Bigint
        status_finished: Bigint
        routes: JSON
    }
    type Forms {
        id: ID
        name: String
        route:Bigint
        settings:JSON
    }

    type DocumentLogs {
        id: ID
        document_id: Bigint
        is_read: Boolean
        user_id: Bigint
        type:Int
    }
    type DocumentTasksLogs{
        id:ID
        task_id: Bigint
        is_read: Boolean
        type: Int
        user_id: Bigint
    }
    type Documents {
        id: ID
        title: String
        reason: JSON
        subject: String
        supllier: String
        status_id: Bigint
        document_statuses: DocumentStatuses
        route_id: DocumentRoutes
        user_id: Bigint
        username:String
        position:String
        fio:String
        date_created: DateTime
        date_modified: DateTime
        step: Bigint
        price: Bigint
        comments: [Comments]
        signatures:[Signatures]
        files:[Files]
        document_logs: [DocumentLogs]
        data_one: [DataOne]
        data_agreement_list: [DataAgreementList]
        data_agreement_list_production:[DataAgreementListProduction]
        data_agreement_list_internal_needs:[DataAgreementListInternalNeeds]
        data_custom:[DataCustom]
        document_tasks:[DocumentTasks]
        route_data:JSON
    }
    type DocumentTasks{
        id: ID
        document_id: Bigint
        status: Bigint
        task_statuses: TaskStatuses
        is_cancelled: Boolean
        note: String
        deadline: String
        date_created: DateTime
        user_id_created: Bigint
        fio_created: String
        user_id_receiver: Bigint
        fio_receiver: String
        route_id: Bigint
        document_options:JSON
        task_files: Bigint
        document_tasks_files: [DocumentTasksFiles]
        document_tasks_logs: [DocumentTasksLogs]
        document: [Documents]
        report: Bigint
    }
    type DocumentTasksFiles{
        id:ID
        filename: String
        data_file: String
        task_id: Bigint
        is_add_to_document: Boolean
    }
    type DataCustom{
        id:ID
        document_id: Bigint
        subject: String
        remark: String
    }
    type DataAgreementList{
        id: ID
        document_id: Bigint
        price: Bigint
        subject: String

        currency_price: String
        executor_name_division: String
        sider_signatures_date: String
        received_from_counteragent_date: String
    }

    type DataAgreementListInternalNeeds{
        id:ID
        document_id: Bigint
        subject: String
        price: Bigint
        currency: String
        executor_name_division: Bigint
        executor_phone_number: Bigint
        counteragent_contacts: String
    }

    type DataAgreementListProduction{
        id:ID
        document_id: Bigint
        subject: String
        price: Bigint
        currency: String
        executor_name_division: Bigint
        executor_phone_number: Bigint
        counteragent_contacts: String
    }
    
    type DataOne{
        id:ID
        document_id: Bigint
        price: Int
        supllier: String
        subject: String
    }

    type Comments {
        id: ID
        comment: String
        document_id: Bigint
        user_id: Bigint
        username:String
        position:String
        fio:String
        date: DateTime
    }

    type DepartamentDictionary{
        id: ID
        departament_name: String
    }

    type DepartamentRelationship{
        id_user: Bigint
        id_departament: Bigint
        is_boss: Boolean
        is_vice_director: Boolean
        is_user: Boolean
        user: User
        departament: DepartamentDictionary
    }

    type Signatures {
        id: ID
        document_id: Bigint
        user_id: Bigint
        username:String
        position:String
        fio:String
        date_signature: String
    }
    

    type Files {
        id: ID
        filename: String
        data_file: String
        document_id: Bigint
    }

    # generated automatically
    type Query {
        test: [Test]
        test1: Test1
        test2: Test2
        test3: Test3
        authMe(test: JSON): [User]
        dateTime: DateTime
        users(users: JSON): [User]
        positions(positions: JSON): [Position]
        user_roles(user_roles: JSON): [Role]
        sessions(sessions: JSON): [Session]
        documents(documents: JSON): [Documents]
        document_comments(document_comments:JSON): [Comments]
        document_signatures(document_signatures:JSON): [Signatures]
        files(files:JSON): [Files]
        document_statuses(document_statuses: JSON): [DocumentStatuses]
        document_routes(document_routes: JSON) : [DocumentRoutes]
        forms(forms: JSON): [Forms]

        departament_relationship(departament_relationship: JSON):[DepartamentRelationship]
        departament_dictionary(departament_dictionary: JSON):[DepartamentDictionary]

        document_logs(document_logs: JSON) : [DocumentLogs]
        document_tasks_logs(document_tasks_logs: JSON) : [DocumentTasksLogs]
        document_tasks_files(document_tasks_files: JSON) : [DocumentTasksFiles]
        task_files(id:Bigint): [Files]
        date_one(data_one: JSON) : [DataOne]
        data_agreement_list(data_agreement_list: JSON): [DataAgreementList]
        data_agreement_list_production(data_agreement_list_production:JSON):[DataAgreementListProduction]
        data_agreement_list_internal_needs(data_agreement_list_internal_needs: JSON):[DataAgreementListInternalNeeds]
        data_custom(data_custom: JSON):[DataCustom]
        document_tasks(document_tasks: JSON):[DocumentTasks]

        get_boss_depart(users:JSON): [User]
    }
    type Mutation {
        login(user: JSON): User

        insertUser(user: JSON): Status
        updateUser(user: JSON): Status
        deleteUser(user: JSON): Status

        updatePassword(username:String, password:String): User

        insertDocument(document: JSON) : Status
        updateDocument(document: JSON) : Status
        deleteDocument(document: JSON) : Status

        setIsReadTrue(document: JSON) : Status
        setTaskIsReadTrue(task: JSON) : Status

        insertComment(comment: JSON) : Status
        updateComment(comment: JSON) : Status
        deleteComment(comment: JSON) : Status

        insertSignature(signature: JSON) : Status
        updateSignature(signature: JSON) : Status
        deleteSignature(signature: JSON) : Status

        setAgreement(agreement: JSON) : Status

        updateDocumentStatusId(documents: JSON) : Status

        insertDocumentStatus(document_statuses: JSON) : Status
        updateDocumentStatus(document_statuses: JSON) : Status
        deleteDocumentStatus(document_statuses: JSON) : Status

        insertForm(forms: JSON) : Status
        updateForm(forms: JSON) : Status
        deleteForm(forms: JSON) : Status

        insertDocumentTasks(document_tasks: JSON) : Status
        updateDocumentTasks(document_tasks: JSON) : Status

        insertDocumentRoute(document_routes: JSON) : Status
        updateDocumentRoute(document_routes: JSON) : Status
        deleteDocumentRoute(document_routes: JSON) : Status

        insertPosition(positions: JSON) : Status
        updatePosition(positions: JSON) : Status
        deletePosition(positions: JSON) : Status

        deleteFile(document_files:JSON):Status

        set_is_add_to_document(ID: Int,state: Boolean):Status
    }
    type Subscription {
        authMe(test: JSON): [User]
        users(users: JSON): [User]
        positions(positions: JSON): [Position]
        sessions(sessions: JSON): [Session]
        documents(documents: JSON): [Documents]

        document_tasks(document_tasks: JSON): [DocumentTasks]

        document_comments(document_comments:JSON): [Comments]
        document_signatures(document_signatures:JSON): [Signatures]
        document_statuses(document_statuses: JSON): [DocumentStatuses]
        document_routes(document_routes: JSON) : [DocumentRoutes]
        forms(forms: JSON): [Forms]

        document_logs(document_logs: JSON) : [DocumentLogs]
        document_tasks_logs(document_tasks_logs: JSON) : [DocumentTasksLogs]

    }
`;

module.exports = typeDefs;
