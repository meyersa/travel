import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import NodeCache from "node-cache";
import { validateTrip } from "./lib/validateTrip.js";
import { populateImages } from "./lib/populateImages.js";
import { configDotenv } from "dotenv";
import { generate } from "./lib/queryOpenAI.js";
configDotenv();

const app = express();
const cache = new NodeCache();

const { MONGO_URL, MONGO_DB, GOOGLE_CONSOLE_ID, GOOGLE_API_KEY, SERVER_KEY, OPENAI_KEY } = process.env;

if (!MONGO_URL || !MONGO_DB) {
  throw new Error("Missing Mongo ENVs")

}

if (!GOOGLE_CONSOLE_ID || !GOOGLE_API_KEY) {
  throw new Error("Missing Google ENVs") 

}

if (!SERVER_KEY) {
  throw new Error("Missing Server API Key")

}

// Setup Mongo Connection
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

    console.log("Mongo is ready...");
  } catch (e) {
    console.error("Unable to connect to MongoDB, ignore if this was during initial build", e);
    process.exit(1);
  }

  console.log(`Startup finished \n\n\n`);
})();

// Setup template engine, view (template) dir, and asset route
app.set("view engine", "ejs");
app.set("views", path.join(path.dirname(fileURLToPath(import.meta.url)), "views"));
app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), "assets")));
app.use(express.json());

// Tries to pull a value from cache or uses a function to set it
async function tryCacheOrSet(name, valueFunction, cacheLength = 3600) {
  const cleanName = String(name).toLowerCase().trim();
  // Standardize all names with lowercase, might cause issues if there are dups

  var cacheRes = await cache.get(cleanName);

  if (cacheRes) {
    console.log(`Cache hit for ${cleanName}`);
    return cacheRes;
  }

  console.log(`Cache miss for ${cleanName}`);

  var newRes = await valueFunction();

  if (!newRes) {
    throw new Error("Value is empty after filling");
  }

  cache.set(cleanName, newRes, cacheLength);
  console.log(`Cache set for ${cleanName}`);
  return newRes;
}

// Get a trip ID (Wrapper for Mongo func)
async function getTrip(id) {
  console.log(`Getting trip information for ${id}`);
  if (!tripsDB) {
    throw new Error("Mongo not set");
  }

  return await tripsDB.findOne({
    id: id,
  });
}

// Basic log for information, can add more  with more headers
function preFlightLog(req) {
  let output = `Received request on ${req.path}`

  if (req.query) {
    output += `, with queries ${JSON.stringify(req.query)}`

  }

  if (req.body.length > 1) {
    output += `, and a body`
  }

  console.log(output)
}

// Clean and verify an input
function cleanAndVerify(value, minLength = 5, maxLength = 300) {
  if (!value) {
    throw new Error("Input value is invalid");
  }

  value = String(value).trim();
  if (value.length < minLength) {
    throw new Error("Input value is too short");

  }
  if(value.length > maxLength) {
    throw new Error("input value is too long")

  }

  return value;
}

async function getTrips() {
  console.log("Getting trips from Mongo");
  if (!tripsDB) {
    return res.status(503).send("Service unavailable");
  }

  return await tripsDB
    .find(
      {},
      {
        projection: {
          id: 1,
          name: 1,
          startDate: 1,
          description: 1,
          picture: 1,
          _id: 0,
        },
      }
    )
    .toArray();
}

// Get specific trip page
app.get("/trip", async (req, res) => {
  preFlightLog(req);

  const { id } = req.query;
  if (!id) {
    return res.status(400).send("Trip ID is required");
  }

  try {
    // Render template with trip data
    // TODO: Handle 404s, missing trip - swap getTrip to a checkTrip(id) func/return False or something
    res.render("trip", { trip: await tryCacheOrSet(id, () => getTrip(id))});
    
  } catch (err) {
    console.error("Failed to get Trip information", err);
    return res.status(503).send("Service unavailable");
  }
});

/* 
 * Handle incoming TripJSON
 * Assumed to be already filled in 
 *  
 * 1. Verifies Structure
 * 2. Checks for Duplicates
 * 3. Populates Images
 * 4. Inserts into Mongo
 * 
 * Everything is caught so output can be assumed safe to render to user if wanted
 */
async function populateAndSubmit(tripJSON) {
  // 1. Validate Trip
  try {
    await validateTrip(tripJSON); 

  } catch(err) {
    console.error("Failed to validate tripJSON", err);
    throw new Error("Failed to validate tripJSON")

  }
  
  // 2. Check for Dups
  try {
    console.log("Checking Mongo for duplicate trips...");
    let result = await tripsDB.findOne({ id: tripJSON.id });

    if (!!result) {
      throw new Error();
    }
  } catch (err) {
    console.error("Found a duplicate trip ID", err);
    throw new Error("Trip name already exists");

  }

  // 3. Populate Images
  try {
    tripJSON = await populateImages(GOOGLE_CONSOLE_ID, GOOGLE_API_KEY, tripJSON);

  } catch(err) {
    console.error("Failed to populate images from google", err)
    throw new Error("Failed to populate images from google")

  }

  // 4. Insert result if not dup
  try {
    console.log("Inserting trip into Mongo...");
    const result = await tripsDB.insertOne(tripJSON);

    if (!result.acknowledged) {
      throw new Error("Result not acknowledged");

    }

    console.log("Uploaded trip to Mongo");
    return true;

  } catch (err) {
    console.error("Failed to upload document to Mongo", err);
    throw new Error("Failed to upload document to Mongo");

  }
}

/* 
 * Create Trip from Form (When the trip is not already made)
 */
app.post("/new", async (req, res) => {
  preFlightLog(req);

  // Get form data from the req body
  var formResp = req.body;
  let where, when, description;
  try {
    where = cleanAndVerify(formResp["where"]);
    when = cleanAndVerify(formResp["when"]);
    description = cleanAndVerify(formResp["description"], undefined, 1500);
  } catch (err) {
    console.error("Could not process /new input", err);
    return res.status(400).send("Invalid response to form");
  }
  
  console.log("Received valid trip request, submitting to ChatGPT")
  const body = {
    where: where,
    when: when, 
    description: description 

  }

  // TODO: Add some kind of global ratelimit - maybe set default time - if within 5 minutes of that then do not process
  var tripJSON;
  try {
    tripJSON = await generate(body, OPENAI_KEY)
    tripJSON = JSON.parse(tripJSON)

  } catch (err) {
    console.error("Failed to query ChatGPT with /add contents", err)
    return res.status(503).send("Error querying ChatGPT")

  }

  try {
    const res = await populateAndSubmit(tripJSON)
    if (res) {
      return res.status(200).send("Submitted tripJSON")

    }
  } catch (err) {
    console.error("Failed to process tripJSON", err);
    return res.status(400).send("Failed to process tripJSON");

  }
});

/* 
 * Create trip from JSON (When the trip is already made)
 */
app.post("/add", async (req, res) => {
  preFlightLog(req);

  // Verify API Key
  const IN_KEY = req.get("X-API-Key");
  if (IN_KEY != SERVER_KEY) {
    console.error("Invalid API Key", IN_KEY)
    return res.status(401).send("Unauthorized");

  }
  console.log("Valid API Key")

  // Try to validate the JSON
  var tripJSON = req.body;
  try {
    if (await populateAndSubmit(tripJSON)) {
      return res.status(200).send("Submitted tripJSON")

    }
  } catch (err) {
    console.error("Failed to process tripJSON", err);
    return res.status(400).send("Failed to process tripJSON");

  }
});

// Get home page
app.get("/", async (req, res) => {
  preFlightLog(req);

  try {
    res.render("index", { trips: await tryCacheOrSet("trips", () => getTrips()) });
  } catch (err) {
    console.error("Error retrieving trips:", err);
    return res.status(503).send("Service unavailable");
  }
});

// Success page
app.get("/success", async (req, res) => {
  preFlightLog(req);
  res.render("success", {});
});

// Create trip GUI
app.get("/new", async (req, res) => {
  preFlightLog(req);
  res.render("new");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});