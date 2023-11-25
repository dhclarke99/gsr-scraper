const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

// Function to read and parse a single PDF file
async function parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);

    // Regular expressions for parsing
    const schoolPattern = /School: (\w+)/;
    const yearPattern = /Cohort Years: (\d{4}-\d{2})/;
    const sportPattern = /(\w+(?: \w+)*): GSR (\d+), Fed Rate (\d+)/g;

    const school = data.text.match(schoolPattern)[1];
    const year = data.text.match(yearPattern)[1];
    const sportsData = [...data.text.matchAll(sportPattern)];

    return { school, year, sportsData };
}

// Main function to process all PDFs in the 'pdfs' directory
async function processPDFs() {
    const pdfDir = path.join(__dirname, 'pdfs');
    const files = fs.readdirSync(pdfDir);

    for (const file of files) {
        if (path.extname(file) === '.pdf') {
            const filePath = path.join(pdfDir, file);
            const data = await parsePDF(filePath);
            console.log(data); // Or save this data to a file/DB as needed
        }
    }
}

processPDFs();
