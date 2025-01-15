const express = require("express");
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

require("dotenv").config();

const app = express();

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

    console.log("Mongo is ready...");
  } catch (e) {
    console.error("Unable to connect to MongoDB, ignore if this was during initial build", e);
    process.exit(1);
  }

  console.log(`Startup finished \n\n\n`);
})();

// Setup template engine, view (template) dir, and asset route
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "assets")));

// Get specific trip page
app.get("/trip", async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).send("Trip ID is required");
  }

  const cleanId = String(id).toLowerCase().trim();

  const jsonData = await tripsDB.findOne({
    id: cleanId,
  });

  // Render the template with trip data
  res.render("trip", { trip: jsonData });
});

// Create trip GUI
app.get("/new", async (req, res) => {
  res.render("new")
})

// Create trip endpoint
// app.post("/new", )



// Add trip endpoint
app.post("/add", async (req, res) => {
  const tripJSON = req.body; 

  console.log("")
})

// Get home page
app.get("/", async (req, res) => {
  if (!tripsDB) {
    throw new Error("MongoDB connection not established");
  }

  const jsonData = await tripsDB
    .find(
      {},
      {
        projection: {
          id: 1,
          name: 1,
          startDate: 1,
          description: 1,
          pictureUrl: 1,
          _id: 0,
        },
      }
    )
    .toArray();

  res.render("index", {trips: jsonData});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
