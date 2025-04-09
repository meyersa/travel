import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { getImage } from "./lib/mongo/images.js";
import { configDotenv } from "dotenv";
import { preFlightLog, cleanAndVerify } from "./lib/util.js";
import { getTripById, getTrips, getFail, populateFail } from "./lib/mongo/trips.js";
import { newTrip } from "./schema/newTrip.js";
import { createTrip } from "./lib/tripInterface.js";
import { logger } from "./lib/logger.js";

configDotenv();
const { SERVER_KEY } = process.env;

logger.info("Starting server...");
const app = express();

logger.info("Validing ENVs");
if (!SERVER_KEY) {
  throw new Error("Missing Server API Key");
}
logger.info("Validated default variables");

// Setup Rate Limiter
let lastExecutionTime = 0;
function checkRate() {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  if (now - lastExecutionTime >= fiveMinutes) {
    logger.debug(`Allowing execution at ${now}`);
    lastExecutionTime = now;
    return true;
  }
  logger.debug(`Denying execution for ${(fiveMinutes - (now - lastExecutionTime)) / 1000} seconds`);
  return false;
}

// Setup template engine, view (template) dir, and asset route
app.set("view engine", "ejs");
app.set("views", path.join(path.dirname(fileURLToPath(import.meta.url)), "views"));
app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), "assets")));
app.use(express.json());
logger.info("Setup default routes");

async function handleUnavailable(res, req) {
  logger.warn(`Received unavailable on ${req.path}. Redirecting...`);
  return res.redirect("/unavailable");
}

async function handleNotFound(res, req) {
  logger.warn(`Received request on nonexistent page ${res.path}. Redirecting...`);
  return res.redirect("/notfound");
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
    res.render("trip", { trip: await getTripById(id) });
  } catch (err) {
    logger.error("Failed to get Trip information", err);
    handleNotFound(res, req);
  }
});

// Get home page
app.get("/", async (req, res) => {
  preFlightLog(req);

  try {
    res.render("index", { trips: await getTrips() });
  } catch (err) {
    logger.error("Error retrieving trips:", err);
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
    logger.warn("Failed to render success", err);
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

  const trip = await getTripById(id);
  if (trip) {
    logger.debug("Trip exists")
    return res.status(200).json({ state: "exists" });

  } 

  const fail = await getFail(id);
  if (fail) {
    logger.debug("Trip Failed")
    return res.status(200).json({ state: "fail" });

  }

  logger.debug("Trip does not exist")
  return res.status(200).json({ state: "no" });
});

// Create Trip Form
app.post("/api/new", async (req, res) => {
  preFlightLog(req);

  // Get form data from the req body
  let body;
  try {
    body = newTrip.parse({
      id: cleanAndVerify(req.body["id"]),
      description: cleanAndVerify(req.body["description"]),
    });
  } catch (err) {
    logger.error(err, "Could not process /new input");
    return res.status(400).send("Invalid response to form");
  }

  logger.debug("Form Input Validated");

  const IN_KEY = cleanAndVerify(req.body["auth"])
  if (IN_KEY != SERVER_KEY) {
    logger.warn("Invalid API Key", IN_KEY);
    return res.status(401).send("Unauthorized");
  }
  logger.debug("Valid API Key");
  
  // Check ratelimit
  if (!checkRate()) {
    return res.status(429).send("Rate limited. Please wait.");
  }

  res.status(200).send("Success");

  var tripJSON;
  try {
    tripJSON = await createTrip(body);
  } catch (err) {
    logger.error("Unable to create trip", err);
    await populateFail(id);
  }
});

// Create trip from JSON
app.post("/api/add", async (req, res) => {
  preFlightLog(req);

  // Verify API Key
  const IN_KEY = req.get("X-API-Key");
  if (IN_KEY != SERVER_KEY) {
    logger.warn("Invalid API Key", IN_KEY);
    return res.status(401).send("Unauthorized");
  }
  logger.debug("Valid API Key");

  // Try to validate the JSON
  try {
    var tripJSON = req.body;

    // Add ID based on submission time
    tripJSON["id"] = String(Date.now());

    if (await populateAndSubmit(tripJSON)) {
      return res.status(200).send("Submitted tripJSON");
    }
  } catch (err) {
    logger.error("Failed to process tripJSON", err);
    return res.status(400).send("Failed to process tripJSON");
  }
});

// Get an image by ID
app.get("/api/images", async (req, res) => {
  preFlightLog(req);

  const { id } = req.query;
  if (!id) {
    return res.status(400).send("Image ID is required");
  }

  try {
    const buffer = await getImage(id);

    if (!buffer) {
      res.status(404).send("Image not found");
    }

    // Set content type
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    logger.error("Failed to retrieve image", err);
    return res.status(500).send("Error retrieving image");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
