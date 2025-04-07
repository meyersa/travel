import { Db, MongoClient } from "mongodb";
import { configDotenv } from "dotenv";
configDotenv();

const { MONGO_URL, MONGO_DB } = process.env 

/* 
 * Mongo Default options
 */
const options = {
  serverSelectionTimeoutMS: 10000,
};

/**
 * Check Mongo Defaults
 */
function checkMongo() {
  console.log("Checking Mongo Requirements...");

  if (!MONGO_URL) {
    console.error("Missing Mongo URL");
    process.exit(1);
  }
  if (!MONGO_DB) {
    console.error("Missing Mongo Database");
    process.exit(1);
  }
  console.log("Passed Mongo Verification");
}



/**
 * Initialize MongoDB and return DB object
 * @returns {Db} - Mongo Initialized Database
 */
export async function initMongo() {
  checkMongo();

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
  return db;
}
