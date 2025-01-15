const { MongoClient } = require("mongodb");
require('dotenv').config(); 
const fs = require("fs");

// Setup Mongo Connection
const { MONGO_URL, MONGO_DB } = process.env;

const options = {
  serverSelectionTimeoutMS: 10000,
};

let tripsDB;
(async () => {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    const client = await MongoClient.connect(MONGO_URL, options);
    console.log("Connected to MongoDB");

    // Connect to specified DB
    console.log("Connecting to specified database");
    const db = client.db(MONGO_DB);

    console.log("Connecting to specified collection");
    tripsDB = db.collection("trips");

    await upload() 
    
    console.log("Mongo is ready...");
  } catch (e) {
    console.error("Unable to connect to MongoDB, ignore if this was during initial build", e);
    process.exit(1);
  }

  console.log(`Startup finished \n\n\n`)

})();

async function upload() {
    const jsonFile = "example.json";

    var jsonData =  fs.readFileSync(jsonFile);
    jsonData = await JSON.parse(jsonData);
    
    await tripsDB.insertOne(jsonData)
}
