const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const collectionName = 'metrics';

async function mergeSchoolData(client, oldSchoolName, newSchoolName) {
    const database = client.db(dbName);
    const collection = database.collection(collectionName);
  
    // Fetch the sports data from the old document
    const oldSchoolData = await collection.findOne({ name: oldSchoolName });
  
    if (oldSchoolData && oldSchoolData.sportsData) {
      const updateQuery = {};
  
      // Prepare the update query for each year
      for (const year in oldSchoolData.sportsData) {
        updateQuery[`sportsData.${year}`] = oldSchoolData.sportsData[year];
      }
  
      // Update the new document with the old document's data for each year
      await collection.updateOne(
        { name: newSchoolName },
        { $set: updateQuery }
      );
  
      // Delete the old document
      await collection.deleteOne({ name: oldSchoolName });
    }
  }
  

async function main() {
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const oldSchoolName = 'University of Alabama, Tuscaloosa';
    const newSchoolName = 'University of Alabama';

    await mergeSchoolData(client, oldSchoolName, newSchoolName);
    console.log('School data merged successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
