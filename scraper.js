const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);

    const schoolPattern = /Cohorts: (.+?)$/m;
    const yearPattern = /(\d{4}) - (\d{4}) Cohorts/;
    const sportPattern = /([A-Za-z\/\.\s]+)(\d{2,3})(\d{2})/g;

    const schoolMatch = data.text.match(schoolPattern);
    const yearMatch = data.text.match(yearPattern);
    const school = schoolMatch ? schoolMatch[1] : 'Unknown School';
    // Modified to only include the last year in the range
    const year = yearMatch ? yearMatch[2] : 'Unknown Year';

    const sections = data.text.split("Women's Sports");
    const menSportsText = sections[0];
    const womenSportsText = "Women's Sports" + (sections[1] || '');

    const extractSportsData = (text) => {
        const sportsData = [];
        let match;
        while ((match = sportPattern.exec(text)) !== null) {
            sportsData.push({
                sport: match[1].trim(),
                GSR: match[2],
                FedRate: match[3]
            });
        }
        return sportsData;
    };

    const menSportsData = extractSportsData(menSportsText);
    const womenSportsData = extractSportsData(womenSportsText);

    return {
        school,
        year,
        sportsData: {
            men: menSportsData,
            women: womenSportsData
        }
    };
}

// Example usage
// Function to process all PDFs in a directory
async function processPDFs(directoryPath) {
    // Read the contents of the directory
    const files = fs.readdirSync(directoryPath);
    // Filter for .pdf files
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));
  
    // Process each PDF file
    for (const file of pdfFiles) {
      const filePath = path.join(directoryPath, file);
      try {
        const data = await parsePDF(filePath);
        console.log(`Data for ${file}:`);
        console.log(JSON.stringify(data, null, 2));
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
  }
  
  // Example usage: specify the directory containing the PDF files
  const pdfDirectoryPath = './pdfs';
  processPDFs(pdfDirectoryPath).catch(console.error);
