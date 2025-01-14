const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.set("view engine", "ejs");

// Set the views directory
app.set("views", path.join(__dirname, "views"));

// Serve static paths, setting up for API use
app.use(express.static(path.join(__dirname, "assets")));

// Temporarily read in from JSON
jsonFile = "/Users/augustmeyers/Coding/travel/example.json";
function readData(file) {
  var jsonData = fs.readFileSync(file);
  return JSON.parse(jsonData);
}

// List all trips (Unfinished)
app.get("/trips", async (req, res) => {
  console.log("Get request received for /trips - UNFINISHED");

  jsonData = readData(jsonFile);

  // Return all trips (Just one for now)
  return res.json([
    {
      id: jsonData["id"],
      name: jsonData["name"],
      startDate: jsonData["startDate"],
      description: jsonData["description"],
      pictureUrl: jsonData["pictureUrl"],
    },
  ]);
});

app.get("/trip", async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).send("Trip ID is required");
  }

  const cleanId = String(id).toLowerCase().trim();

  jsonData = readData(jsonFile);

  // Render the template with trip data
  res.render("trip", { trip: jsonData });
});

app.get("/", async (req, res) => {
  res.render("index");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
