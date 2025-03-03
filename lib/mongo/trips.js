import { initMongo } from "./mongo.js";

const db = await initMongo();
const tripsDB = db.collection("trips");
const failsDB = db.collection("fails");

/**
 * Retrieves a trip by its ID.
 * @param {string} tripId - The ID of the trip to retrieve.
 * @returns {Promise<Object|null>} - The found trip or null if not found.
 */
export async function getTripById(tripId) {
  try {
    const trip = await tripsDB.findOne({ id: tripId });
    if (!trip) {
      console.log(`Trip with ID ${tripId} not found.`);
      return null;
    }
    console.log(`Trip retrieved: ${tripId}`);
    return trip;
  } catch (error) {
    console.error(`Error retrieving trip with ID ${tripId}:`, error);
    return null;
  }
}

/**
 * Checks if a trip ID already exists in the database.
 * @param {string} id - Trip ID to check.
 * @returns {boolean} - True if duplicate, false if not
 * @throws {Error} - If duplicate is found.
 */
export async function checkForDups(id) {
  console.log("Checking Mongo for duplicate trips...");

  try {
    const result = await tripsDB.findOne({ id });

    if (result) {
      console.error("Duplicate trip ID found:", id);
      return true;
    }
  } catch (err) {
    console.error("Error checking duplicates:", err);
    throw new Error("Duplicate check failed.");
  }

  console.log("No duplicates found.");
  return false;
}

/**
 * Adds a new trip to the database.
 * @param {Object} tripJSON - The trip data to insert (must contain an "id" field).
 * @returns {Promise<boolean>} - True if inserted, false otherwise.
 */
export async function addTrip(tripJSON) {
  if (!tripJSON.id) {
    console.error("Trip must have an 'id' field.");
    return false;
  }

  if (await checkForDups(tripJSON.id)) {
    console.error("Found trip with existing ID, not adding");
    return false;
  }

  // Add if everything else passes
  try {
    console.log(`Inserting Trip ${tripJSON.id}`);

    const result = await tripsDB.insertOne(tripJSON);
    if (result.acknowledged) {
      console.log(`Trip added: ${tripJSON.id}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error adding trip:", error);
    return false;
  }
}

/**
 * Updates (overwrites) a trip by ID.
 * @param {Object} tripJSON - The trip data to replace the existing trip (must contain an "id" field).
 * @returns {Promise<boolean>} - True if updated, false otherwise.
 */
export async function updateTrip(tripJSON) {
  if (!tripJSON.id) {
    console.error("Trip must have an 'id' field.");
    return false;
  }

  try {
    const result = await tripsDB.replaceOne(
      { id: tripJSON.id }, // Match by "id" field
      tripJSON,
      { upsert: true } // Insert if not found
    );

    if (result.modifiedCount > 0) {
      console.log(`Trip updated: ${tripJSON.id}`);
      return true;
    } else if (result.upsertedCount > 0) {
      console.log(`Trip not found, new trip added: ${tripJSON.id}`);
      return true;
    }

    console.log(`No changes made for trip: ${tripJSON.id}`);
    return false;
  } catch (error) {
    console.error(`Error updating trip with ID ${tripJSON.id}:`, error);
    return false;
  }
}

/**
 * Deletes a trip by its ID.
 * @param {string} tripId - The ID of the trip to delete.
 * @returns {Promise<boolean>} - True if deleted, false otherwise.
 */
export async function deleteTrip(tripId) {
  try {
    const result = await tripsDB.deleteOne({ id: tripId });
    if (result.deletedCount > 0) {
      console.log(`Trip deleted: ${tripId}`);
      return true;
    } else {
      console.log(`Trip with ID ${tripId} not found.`);
      return false;
    }
  } catch (error) {
    console.error(`Error deleting trip with ID ${tripId}:`, error);
    return false;
  }
}

/**
 * Create a failure event
 * @param {String} id - ID to mark as failure
 * @returns {Boolean} - Status
 */
export async function populateFail(id) {
  console.log(`Failured received when creating trip ${id}`);

  try {
    await failsDB.insertOne({ id: id });
    console.log(`Uploaded failure to Mongo ${id}`);
    return true;
  } catch (err) {
    console.error(`Failed to upload failure (ironic) to Mongo ${id}`);
    return false;
  }
}

/**
 * Get a failure by ID
 * @param {String} id - Failure to retrieve
 * @returns {boolean} - Basically truthy if one exists or not
 */
export async function getFail(id) {
  console.log(`Checking for fail ${id}`);
  if (!failsDB) {
    throw new Error("Mongo is unavailable");
  }

  return await failsDB.findOne({
    id: id,
  });
}
