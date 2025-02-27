import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import NodeCache from "node-cache";
import { validateTrip } from "./lib/validateTrip.js";
import { populateImages } from "./lib/populateImages.js";
import { getImage } from "./lib/handleImages.js";
import { configDotenv } from "dotenv";
import { generate } from "./lib/queryOpenAI.js";
import { initMongo } from "./lib/mongo.js";
configDotenv();

const { MONGO_URL, MONGO_DB, SERVER_KEY, OPENAI_KEY } = process.env;

console.log("Starting server...");
const app = express();
const cache = new NodeCache();

function defaultValidation() {
  console.log("Validing ENVs");

  if (!MONGO_URL || !MONGO_DB) {
    throw new Error("Missing Mongo ENVs");
  }

  if (!SERVER_KEY) {
    throw new Error("Missing Server API Key");
  }

  console.log("Validated default variables");
}
defaultValidation();

// Setup Rate Limiter
let lastExecutionTime = 0;
function checkRate() {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  if (now - lastExecutionTime >= fiveMinutes) {
    console.log(`Allowing execution at ${now}`);
    lastExecutionTime = now;
    return true;
  }
  console.log(`Denying execution for ${(fiveMinutes - (now - lastExecutionTime)) / 1000} seconds`);
  return false;
}

const db = await initMongo(MONGO_URL, MONGO_DB);
const tripsDB = db.collection("trips");
const failsDB = db.collection("fails");

// Setup template engine, view (template) dir, and asset route
app.set("view engine", "ejs");
app.set("views", path.join(path.dirname(fileURLToPath(import.meta.url)), "views"));
app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), "assets")));
app.use(express.json());
console.log("Setup default routes");

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

/*
 * Get a trip ID (Reuse tryCacheOrSet for this)
 * 1. Check cache for trip ID, return if exist
 * 2. Query Mongo for trip ID, throw error if not exist
 * 3. Set cache for trip ID
 * 4. Return trip
 */
async function getTrip(id) {
  return await tryCacheOrSet(id, async () => {
    console.log(`Getting trip information for ${id}`);
    if (!tripsDB) {
      throw new Error("Mongo is unavailable");
    }

    return await tripsDB.findOne({
      id: id,
    });
  });
}

// Basic log for information, can add more with more headers
function preFlightLog(req) {
  let output = `Received request on ${req.path}`;

  if (req.query) {
    output += `, with queries ${JSON.stringify(req.query)}`;
  }

  if (req.body.length > 1) {
    output += `, and a body`;
  }

  console.log(output);
}

async function handleUnavailable(res, req) {
  console.log(`Received unavailable on ${req.path}. Redirecting...`);
  return res.redirect("/unavailable");
}

async function handleNotFound(res, req) {
  console.log(`Received request on nonexistent page ${res.path}. Redirecting...`);
  return res.redirect("/notfound");
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
  if (value.length > maxLength) {
    throw new Error("input value is too long");
  }

  return value;
}

async function getTrips() {
  console.log("Getting trips from Mongo");
  if (!tripsDB) {
    throw new Error("Mongo is unavailable");
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

/*
 * Handle incoming TripJSON
 * Assumed to be already filled in
 *
 * 1. Verifies Structure
 * 2. Checks for Duplicates
 * 3. Populates Images
 * 4. Inserts into Mongo
 * 5. Reset trip cache
 *
 * Everything is caught so output can be assumed safe to render to user if wanted
 */
async function populateAndSubmit(tripJSON) {
  // 1. Validate Trip
  try {
    await validateTrip(tripJSON);
  } catch (err) {
    console.error("Failed to validate tripJSON", err);
    throw new Error("Failed to validate tripJSON");
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
    tripJSON = await populateImages(OPENAI_KEY, tripJSON, db);
  } catch (err) {
    console.error("Failed to populate images from google", err);
    throw new Error("Failed to populate images from google");
  }

  // 4. Insert result if not dup
  try {
    console.log("Inserting trip into Mongo...");
    const result = await tripsDB.insertOne(tripJSON);

    if (!result.acknowledged) {
      throw new Error("Result not acknowledged");
    }

    console.log("Uploaded trip to Mongo");
  } catch (err) {
    console.error("Failed to upload document to Mongo", err);
    throw new Error("Failed to upload document to Mongo");
  }

  try {
    cache.del("trips");
  } catch (err) {
    console.error("Failed to delete Trip cache", err);
  }

  console.log("Finished populating and submitting.");
  return true;
}

// Handle failure submission
async function populateFail(id) {
  console.log(`Failured received when creating trip ${id}`);

  try {
    await failsDB.insertOne({ id: id });

    console.log(`Uploaded failure to Mongo ${id}`);
  } catch (err) {
    console.error(`Failed to upload failure (ironic) to Mongo ${id}`);
  }
}

// Check for fail
async function getFail(id) {
  return await tryCacheOrSet(id, async () => {
    console.log(`Checking for fail ${id}`);
    if (!failsDB) {
      throw new Error("Mongo is unavailable");
    }

    return await failsDB.findOne({
      id: id,
    });
  });
}

/*
 * User Rendered Pages
 */

// Get specific trip page
app.get("/trip", async (req, res) => {
  preFlightLog(req);

  const { id } = req.query;
  if (!id) {
    handleNotFound(res, req);
  }

  try {
    // Render template with trip data
    res.render("trip", { trip: await getTrip(id) });
  } catch (err) {
    console.error("Failed to get Trip information", err);
    handleNotFound(res, req);
  }
});

// Get home page
app.get("/", async (req, res) => {
  preFlightLog(req);

  try {
    res.render("index", { trips: await tryCacheOrSet("trips", () => getTrips()) });
  } catch (err) {
    console.error("Error retrieving trips:", err);
    handleUnavailable(res, req);
  }
});

// Success page
app.get("/success", async (req, res) => {
  preFlightLog(req);

  // Shouldn't be here without an ID
  const { id } = req.query;
  if (!id) {
    handleNotFound(res, req);
  }

  try {
    res.render("success");
  } catch (err) {
    console.log("Failed to render success", err);
    handleUnavailable(res, req);
  }
});

// Fail Page
app.get("/fail", async (req, res) => {
  preFlightLog(req);
  res.render("fail");
});

// Create trip GUI
app.get("/new", async (req, res) => {
  preFlightLog(req);
  res.render("new");
});

// 503 Page
app.get("/unavailable", async (req, res) => {
  preFlightLog(req);
  res.render("unavailable");
});

// 404 Page
app.get("/notfound", async (req, res) => {
  preFlightLog(req);
  res.render("notfound");
});

/*
 * API Pages
 */

// Check if a trip exists or not for web endpoint
app.get("/api/check", async (req, res) => {
  preFlightLog(req);

  const { id } = req.query;
  if (!id) {
    return res.status(400).send("Trip ID is required");
  }

  try {
    await getTrip(id);
    return res.status(200).json({ state: "exists" });
  } catch (err) {
    // Doesn't exist then check fails
    try {
      await getFail(id);
      return res.status(200).json({ state: "fail" });
    } catch (err) {
      return res.status(200).json({ state: "no" });
    }
  }
});

/*
 * Create Trip from Form (When the trip is not already made)
 */
app.post("/api/new", async (req, res) => {
  preFlightLog(req);

  // Get form data from the req body
  let id, where, when, description;
  try {
    var formResp = req.body;

    id = cleanAndVerify(formResp["id"]);
    where = cleanAndVerify(formResp["where"]);
    when = cleanAndVerify(formResp["when"]);
    description = cleanAndVerify(formResp["description"], undefined, 3000);
  } catch (err) {
    console.error("Could not process /new input", err);
    return res.status(400).send("Invalid response to form");
  } finally {
    console.log("Form Input Validated");
  }

  // Transition to Dictionary
  const body = {
    where: where,
    when: when,
    description: description,
  };

  // Check ratelimit
  if (!checkRate()) {
    return res.status(429).send("Rate limited. Please wait.");
  }

  res.status(200).send("Success");

  var tripJSON;
  try {
    tripJSON = await generate(body, OPENAI_KEY);
    tripJSON = JSON.parse(tripJSON);
    tripJSON["id"] = id;
  } catch (err) {
    console.error("Failed to query ChatGPT with /add contents", err);
    await populateFail(id);
  }

  try {
    if (await populateAndSubmit(tripJSON)) {
    }
  } catch (err) {
    console.error("Failed to process tripJSON", err);
    await populateFail(id);
  }
});

/*
 * Create trip from JSON (When the trip is already made)
 */
app.post("/api/add", async (req, res) => {
  preFlightLog(req);

  // Verify API Key
  const IN_KEY = req.get("X-API-Key");
  if (IN_KEY != SERVER_KEY) {
    console.error("Invalid API Key", IN_KEY);
    return res.status(401).send("Unauthorized");
  }
  console.log("Valid API Key");

  // Try to validate the JSON
  try {
    var tripJSON = req.body;

    // Add ID based on submission time
    tripJSON["id"] = String(Date.now());

    if (await populateAndSubmit(tripJSON)) {
      return res.status(200).send("Submitted tripJSON");
    }
  } catch (err) {
    console.error("Failed to process tripJSON", err);
    return res.status(400).send("Failed to process tripJSON");
  }
});

/*
 * Get an image by ID
 */
app.get("/api/images", async (req, res) => {
  preFlightLog(req);

  const { id } = req.query;
  if (!id) {
    return res.status(400).send("Image ID is required");
  }

  try {
    const buffer = await getImage(db, id);

    if (!buffer) {
      res.status(404).send("Image not found");
    }

    // Set content type
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error("Failed to retrieve image", err);
    return res.status(500).send("Error retrieving image");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
