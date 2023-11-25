const fs = require('fs');
const pdf = require('pdf-parse');

async function parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);

    const schoolPattern = /Cohorts: (.+?)$/m;
    const yearPattern = /(\d{4} - \d{4}) Cohorts/;
    // Revised regex pattern to handle sports names better
    const sportPattern = /([A-Za-z\/\.\s]+)(\d{2,3})(\d{2})/g;

    const schoolMatch = data.text.match(schoolPattern);
    const yearMatch = data.text.match(yearPattern);
    const school = schoolMatch ? schoolMatch[1] : 'Unknown School';
    const year = yearMatch ? yearMatch[1] : 'Unknown Year';

    const sections = data.text.split("Women's Sports");
    const menSportsText = sections[0];
    const womenSportsText = "Women's Sports" + (sections[1] || ''); // Safeguard against missing women's section

    // Function to extract and format sports data
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
const filePath = './pdfs/ASU GSR 2006-09.pdf';
parsePDF(filePath).then(data => {
    console.log(JSON.stringify(data, null, 2));
});
