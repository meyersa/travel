import { Db, MongoClient } from "mongodb";
import { configDotenv } from "dotenv";
import { logger } from "../logger.js";

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
  logger.info("Checking Mongo Requirements...");

  if (!MONGO_URL) {
    logger.error("Missing Mongo URL");
    process.exit(1);
  }
  if (!MONGO_DB) {
    logger.error("Missing Mongo Database");
    process.exit(1);
  }
  logger.info("Passed Mongo Verification");
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
    logger.info("Connecting to MongoDB...");
    const client = await MongoClient.connect(MONGO_URL, options);
    logger.info("Connected to MongoDB");

    // Connect to specified DB
    logger.info("Connecting to specified database");
    db = client.db(MONGO_DB);

    logger.info("Mongo is ready...");
  } catch (e) {
    logger.error("Unable to connect to MongoDB, ignore if this was during initial build", e);
    process.exit(1);
  }

  logger.info(`Startup finished`);
  return db;
}
