"use strict";
const path = require("path");

const libre = require("libreoffice-convert");
libre.convertAsync = require("util").promisify(libre.convert);

async function convertAnyFileToPdf(base64doc) {
	const ext = ".pdf";
	const buf = Buffer.from(
		`${base64doc.substr(base64doc.lastIndexOf(",") + 1)}`,
		"base64"
	);
	// // Convert it to pdf format with undefined filter (see Libreoffice docs about filter)    
    return await libre.convertAsync(buf, ext, undefined);
}

module.exports = {
    convertAnyFileToPdf
}