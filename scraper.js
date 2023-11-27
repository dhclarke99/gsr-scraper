const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { MongoClient } = require('mongodb');
require('dotenv').config();


async function parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);

    const schoolPattern = /Cohorts: (.+?)$/m;
    const yearPattern = /(\d{4})\s*-\s*(\d{4}) Cohorts/;

    const sportPattern = /([A-Za-z\/\.\s]+)(\d{2,3})(\d{2})/g;

    const schoolMatch = data.text.match(schoolPattern);
    const yearMatch = data.text.match(yearPattern);
    const school = schoolMatch ? schoolMatch[1] : 'Unknown School';
    // Modified to only include the last year in the range
    const year = yearMatch ? (yearMatch[2] || yearMatch[1]) : 'Unknown Year';

    const sections = data.text.split("Women's Sports");
    const menSportsText = sections[0];
    const womenSportsText = "Women's Sports" + (sections[1] || '');

    const extractSportsData = (text) => {
        const sportsData = [];
        const lines = text.split('\n'); // Split the text into lines
        const sportPattern = /^([A-Za-z\/\.\s]+)(\d{2,3})(\d{2,3})$/;
        let capturing = false;
    
        for (const line of lines) {
            if (line.startsWith('Sport')) {
                capturing = true; // Start capturing data after 'Sport'
                continue;
            }
    
            if (!capturing || line.startsWith('Graduation') || line.startsWith("Men's") || /^\d{4}$/.test(line)) {
                continue; // Skip lines with these keywords or a 4-digit year
            }
    
            const match = line.match(sportPattern);
            if (match) {
                let sport = match[1].trim();
                let GSR = match[2];
                let FedRate = match[3];
    
                if (parseInt(GSR) > 100) {
                    FedRate = GSR[2] + FedRate; // Adjust FedRate if GSR is above 100
                    GSR = GSR.substring(0, 2);   // Adjust GSR to two digits
                }
    
                sportsData.push({ sport, GSR, FedRate });
            }
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

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const collectionName = 'metrics'; // Set to your new collection name

// Function to insert data into MongoDB
async function insertDataToMongoDB(schoolsData) {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    // Insert data into the collection
    // Since schoolsData is an object, use insertMany with Object.values to insert documents
    const result = await collection.insertMany(Object.values(schoolsData));
    console.log(`${result.insertedCount} documents were inserted`);
  } catch (error) {
    console.error('Error inserting data into MongoDB:', error);
  } finally {
    await client.close();
  }
}


async function processPDFs(directoryPath) {
    const files = fs.readdirSync(directoryPath);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));
    const schoolsData = {}; // Object to hold all schools data
  
    for (const file of pdfFiles) {
      const filePath = path.join(directoryPath, file);
      try {
        const data = await parsePDF(filePath);
        
        // Create a unique key for the school, using the school name
        const schoolKey = data.school.toLowerCase().replace(/\s+/g, '_');
        
        // Initialize the school object if it doesn't exist
        if (!schoolsData[schoolKey]) {
          schoolsData[schoolKey] = {
            name: data.school,
            sportsData: {}
          };
        }
        
        // Add the year's data to the school object
        schoolsData[schoolKey].sportsData[data.year] = {
          men: data.sportsData.men,
          women: data.sportsData.women
        };
  
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
  
    fs.writeFileSync('output.json', JSON.stringify(schoolsData, null, 2));
    console.log('Data written to output.json');

    await insertDataToMongoDB(schoolsData);
  }


// Example usage
const pdfDirectoryPath = './pdfs'; // Directory containing the PDF files
processPDFs(pdfDirectoryPath).catch(console.error);