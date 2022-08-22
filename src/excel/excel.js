let xl = require('excel4node');

let wb = new xl.Workbook();

module.exports = {

    generateXlsx: async (res, client, tableData) => {
        console.log('tableData-------', tableData.length)
        let ws = wb.addWorksheet('Sheet 1');

        let style = wb.createStyle({
            font: {
                color: '#000000',
                size: 12
            },
            numberFormat: '$#,##0.00; ($#,##0.00); -'
        })

        // Set value of cell A1 to 100 as a number type styled with paramaters of style
        ws.cell(1, 1)
            .string('Наименование договора')
            .style(style);

        // Set value of cell B1 to 200 as a number type styled with paramaters of style
        ws.cell(1, 2)
            .string('Имя контрагента')
            .style(style);

        // Set value of cell C1 to a formula styled with paramaters of style
        ws.cell(1, 3)
            .string('Цена')
            .style(style);

        // Set value of cell A2 to 'string' styled with paramaters of style
        ws.cell(1, 4)
            .string('Дата и время создания')
            .style(style);

        // Set value of cell A3 to true as a boolean type styled with paramaters of style but with an adjustment to the font size.
        ws.cell(1, 5)
            .style(style)
            .string('Тип договора')
        for (let i = 0; i < tableData.length; i++) {
            ws.cell(i + 2, 1)
                .style(style)
                .string(`${tableData[i].title}`)

            ws.cell(i + 2, 2)
                .style(style)
                .string(`${tableData[i].counteragent_name}`)
            ws.cell(i + 2, 3)
                .style(style)
                .number(`${tableData[i].price}`)
            ws.cell(i + 2, 4)
                .style(style)
                .date(new Date(`${tableData[i].date_created}`))
            ws.cell(i + 2, 5)
                .style(style)
                .number(`${tableData[i].route_id}`)
        }

        res
            .set('content-disposition', `attachment; filename*=UTF-8''${encodeURI('Excel.xlsx')}`) // filename header
            .type('.xlsx') // setting content-type to xlsx. based on file extention

        wb.write('Excel.xlsx', res);
    }
}