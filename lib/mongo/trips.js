import { initMongo } from "./mongo.js";
import { getCache, setCache, resetCache } from "../cache.js";
import { logger } from "../logger.js";

const db = await initMongo();
const tripsDB = db.collection("trips");
const failsDB = db.collection("fails");

/**
 * Retrieves a trip by its ID.
 * @param {string} tripId - The ID of the trip to retrieve.
 * @returns {Promise<Object|null>} - The found trip or null if not found.
 */
export async function getTripById(tripId) {
  const cached = getCache(tripId);
  if (cached) return cached;

  try {
    const trip = await tripsDB.findOne({ id: tripId });

    if (!trip) {
      logger.info(`Trip with ID ${tripId} not found.`);
      return null;
    }

    logger.info(`Trip retrieved: ${tripId}`);
    setCache(tripId, trip);
    return trip;
  } catch (error) {
    logger.warn(`Error retrieving trip with ID ${tripId}:`, error);
    return null;
  }
}

/**
 * Get all trips from Mongo
 * @returns {Array} - All trips
 * @throws {Error} - When all trips cannot be queried
 */
export async function getTrips() {
  logger.info("Retrieving all trips");

  const cacheKey = "all_trips";
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const trips = await tripsDB
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
    logger.info(`Returning ${trips.length} trips`);
    setCache(cacheKey, trips);
    return trips;
  } catch (err) {
    logger.error("Unable to query all trips", err);
    throw new Error("Failed to query Mongo");
  }
}

/**
 * Checks if a trip ID already exists in the database.
 * @param {string} id - Trip ID to check.
 * @returns {boolean} - True if duplicate, false if not
 * @throws {Error} - If duplicate is found.
 */
export async function checkForDups(id) {
  logger.info("Checking Mongo for duplicate trips...");

  try {
    const result = await tripsDB.findOne({ id });

    if (result) {
      logger.warn("Duplicate trip ID found:", id);
      return true;
    }
  } catch (err) {
    logger.error("Error checking duplicates:", err);
    throw new Error("Duplicate check failed.");
  }

  logger.info("No duplicates found.");
  return false;
}

/**
 * Adds a new trip to the database.
 * @param {Object} tripJSON - The trip data to insert (must contain an "id" field).
 * @returns {Promise<boolean>} - True if inserted, false otherwise.
 */
export async function addTrip(tripJSON) {
  if (!tripJSON.id) {
    logger.warn("Trip must have an 'id' field.");
    return false;
  }

  if (await checkForDups(tripJSON.id)) {
    logger.warn("Found trip with existing ID, not adding");
    return false;
  }

  // Add if everything else passes
  try {
    logger.info(`Inserting Trip ${tripJSON.id}`);

    const result = await tripsDB.insertOne(tripJSON);
    if (result.acknowledged) {
      logger.info(`Trip added: ${tripJSON.id}`);
      resetCache(tripJSON.id);
      resetCache("all_trips");

      return true;
    }
    return false;
  } catch (error) {
    logger.error("Error adding trip:", error);
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
    logger.warn("Trip must have an 'id' field.");
    return false;
  }

  try {
    const result = await tripsDB.replaceOne(
      { id: tripJSON.id }, // Match by "id" field
      tripJSON,
      { upsert: true } // Insert if not found
    );

    if (result.modifiedCount == 0 && result.upsertedCount == 0) {
      logger.info(`No changes made for trip: ${tripJSON.id}`);
      return false;
    }

    resetCache(tripJSON.id);
    resetCache("all_trips");

    if (result.modifiedCount > 0) {
      logger.info(`Trip updated: ${tripJSON.id}`);
      return true;
    } else if (result.upsertedCount > 0) {
      logger.info(`Trip not found, new trip added: ${tripJSON.id}`);
      return true;
    }
  } catch (error) {
    logger.error(`Error updating trip with ID ${tripJSON.id}:`, error);
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
      logger.info(`Trip deleted: ${tripId}`);
      resetCache(tripId);
      resetCache("all_trips");

      return true;
    } else {
      logger.info(`Trip with ID ${tripId} not found.`);
      return false;
    }
  } catch (error) {
    logger.error(`Error deleting trip with ID ${tripId}:`, error);
    return false;
  }
}

/**
 * Create a failure event
 * @param {String} id - ID to mark as failure
 * @returns {Boolean} - Status
 */
export async function populateFail(id) {
  logger.info(`Failured received when creating trip ${id}`);

  try {
    await failsDB.insertOne({ id: id });
    logger.debug(`Uploaded failure to Mongo ${id}`);
    return true;
  } catch (err) {
    logger.error(`Failed to upload failure (ironic) to Mongo ${id}`);
    return false;
  }
}

/**
 * Get a failure by ID
 * @param {String} id - Failure to retrieve
 * @returns {boolean} - Basically truthy if one exists or not
 */
export async function getFail(id) {
  logger.info(`Checking for fail ${id}`);
  if (!failsDB) {
    throw new Error("Mongo is unavailable");
  }

  return await failsDB.findOne({
    id: id,
  });
}
