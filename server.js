import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import NodeCache from "node-cache";
import { validateTrip } from "./lib/validateTrip.js";
import { populateImages } from "./lib/populateImages.js";
import { configDotenv } from "dotenv";
configDotenv();

const app = express();
const cache = new NodeCache();

const { MONGO_URL, MONGO_DB, GOOGLE_CONSOLE_ID, GOOGLE_API_KEY, SERVER_KEY } = process.env;

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
  if (value.length < minLength || value.length > maxLength) {
    throw new Error("Input value is not the correct length");
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
    res.render("trip", { trip: await tryCacheOrSet(id, () => getTrip(id)) });
  } catch (err) {
    console.error("Failed to get Trip information", err);
    return res.status(503).send("Service unavailable");
  }
});

// Create trip endpoint
app.post("/new", async (req, res) => {
  preFlightLog(req);

  // Get form data from the req body
  var formResp = req.body;
  let where, when, desc;
  try {
    where = cleanAndVerify(formResp["where"]);
    when = cleanAndVerify(formResp["when"]);
    desc = cleanAndVerify(formResp["desc"]);
  } catch (err) {
    console.error("Could not process /new input", err);
    res.status(400).send("Invalid response to form");
  }

  console.log(`Received trip request for\nWhere: ${where}\nWhen: ${when}\nDescription: ${desc}\n`);
  res.status(200).send("Success");
});

// Add trip endpoint
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
    await validateTrip(tripJSON);
  } catch (err) {
    console.error(err);
    return res.status(400).send("Trip JSON failed validation");
  }

  // Populate Images
  tripJSON = await populateImages(GOOGLE_CONSOLE_ID, GOOGLE_API_KEY, tripJSON);

  if (!tripsDB) {
    return res.status(503).send("Service unavailable");
  }

  // Check for duplicates
  try {
    console.log("Checking Mongo for duplicate trips...");
    let result = await tripsDB.findOne({ id: tripJSON.id });

    if (!!result) {
      throw new Error();
    }
  } catch (err) {
    console.error("Found a duplicate trip ID");
    return res.status(400).send("Trip name already exists");
  }

  // Insert result if not dup
  var result;
  try {
    console.log("Inserting trip into Mongo...");
    result = await tripsDB.insertOne(tripJSON);

    if (!result.acknowledged) {
      throw new Error("Result not acknowledged");
    }

    console.log("Uploaded trip to Mongo");
    return res.status(200).send("Success");
  } catch (err) {
    console.error("Failed to upload document to Mongo", err);
    return res.status(503).send("Service unavailable");
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
