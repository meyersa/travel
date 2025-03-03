import { initMongo } from "./mongo.js";

const db = await initMongo()
const tripsDB = db.collection("trips");
const failsDB = db.collection("fails");

/* 
 * Get all trips from Mongo
 */
export async function getTrips() {
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

export async function newTrip() {
  // Query ChatGPT for trip 
  // ^ This should verify the output already 

  // Populate the first image
  // Put it in Mongo
}

async function checkForDups(id) {
  console.log("Checking Mongo for duplicate trips...");

  try {
    let result = await tripsDB.findOne({ id: id });

    if (!!result) {
      throw new Error();

    }
  } catch (err) {
    console.error("Found a duplicate trip ID", err);
    throw new Error("Trip name already exists");

  }
  console.log("No duplicates found")
  
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
export async function populateAndSubmit(tripJSON) {
  // 1. Validate Trip
  try {
    await validateTrip(tripJSON);
  } catch (err) {
    console.error("Failed to validate tripJSON", err);
    throw new Error("Failed to validate tripJSON");
  }

  // 2. Check for Dups
  checkForDups(tripJSON.id)

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
export async function populateFail(id) {
  console.log(`Failured received when creating trip ${id}`);

  try {
    await failsDB.insertOne({ id: id });

    console.log(`Uploaded failure to Mongo ${id}`);
  } catch (err) {
    console.error(`Failed to upload failure (ironic) to Mongo ${id}`);
  }
}

// Check for fail
export async function getFail(id) {
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
 * Get a trip ID (Reuse tryCacheOrSet for this)
 * 1. Check cache for trip ID, return if exist
 * 2. Query Mongo for trip ID, throw error if not exist
 * 3. Set cache for trip ID
 * 4. Return trip
 */
export async function getTrip(id) {
  console.log(`Getting trip information for ${id}`);
  if (!tripsDB) {
    throw new Error("Mongo is unavailable");
  }

  return await tripsDB.findOne({
    id: id,
  });
}
