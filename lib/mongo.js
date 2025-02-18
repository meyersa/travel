import { MongoClient } from "mongodb";

// Setup Mongo Connection
const options = {
    serverSelectionTimeoutMS: 10000,
  };

export async function initMongo(MONGO_URL, MONGO_DB) {
    var db;
    try {
        // Connect to MongoDB
        console.log("Connecting to MongoDB...");
        const client = await MongoClient.connect(MONGO_URL, options);
        console.log("Connected to MongoDB");
    
        // Connect to specified DB
        console.log("Connecting to specified database");
        db = client.db(MONGO_DB);
    
        console.log("Mongo is ready...");
      } catch (e) {
        console.error("Unable to connect to MongoDB, ignore if this was during initial build", e);
        process.exit(1);
      }
    
      console.log(`Startup finished`);
      return db
}