import { newTrip } from "../schema/newTrip.js";
import { addTrip, getTripById, populateFail, updateTrip } from "./mongo/trips.js";
import { generateTrip } from "./openAI/generateTrip.js";
import { tripSchema } from "../schema/tripSchema.js";
import { generateImage } from "./openAI/generateImages.js";
import { logger } from "./logger.js";

const { IMAGE_SUGGESTED_LIMIT = 5 } = process.env;

/**
 * Delete a trip from Mongo based on ID
 * Called from Trip view page 
 * 
 * - TODO: Needs to be owned first? 
 * 
 * @param {String} id 
 */
export async function deleteTrip(id) {
  logger.error("Stub for delete trip")
}

/**
 * Refresh a trip by ID
 * Called from trip view page
 * 
 * - TODO: Needs to have Creation info stored in page
 * 
 * @param {String} id 
 */
export async function refreshTrip(id) {
  logger.error("Stub for refresh trip")
}

/**
 * Handle Failure for trip creation
 * @param {String} ID - Failed ID to handle
 * @returns {Boolean} - Status of fail (true for success)
 */
export async function handleFail(id) {
  logger.debug(`Handling failure for ${id}`);

  // This is already a fail case, so not much can be done
  if (!id) {
    logger.error("Invalid ID sent in for handleFail?");
    return false;
  }

  return await populateFail(id);
}

/**
 * Create a Trip with ChatGPT for the itinerary, then fill it with Dalle Images
 * @param {newTrip} body - Dictionary input for creation
 * @returns {boolean} - If it was created or not
 * @throws {Error} - If there are issues parsing or creating trip
 */
export async function createTrip(body, bg = true) {
  logger.info(`Creating trip with given input ${body.id}`);

  // Validate Input
  let parsedBody;
  try {
    parsedBody = newTrip.parse(body);
  } catch (err) {
    logger.error("Failed to parse body with Zod", err);
    throw new Error("Could not parse body");
  }

  // Generate trip
  let tripJSON;
  try {
    let generatedJSON = await generateTrip(body);
    tripJSON = tripSchema.parse(generatedJSON);
  } catch (err) {
    logger.error("Failed to get a trip JSON from ChatGPT", err);
    throw new Error("Could not retrieve trip from ChatGPT");
  }

  // Generate title image
  try {
    tripJSON.picture = await generateImage(tripJSON.pictureSearchTerms, true);
  } catch (err) {
    logger.error("Failed to generate trip image with Dalle", err);
    throw new Error("Could not generate title image");
  }

  // Add back new trip info 
  tripJSON.newTrip = parsedBody 

  // Spawn background task to finish rest of images and save to Mongo via update trip
  if (bg) {
    setTimeout(() => {
      createBackgroundImages(tripJSON.id)
  
    }, 5000) // Has to wait for trip to be saved
  }

  return addTrip(tripJSON);

  // TODO: When error, create populateFail Or retry? 
}

/**
 * Generate Background Images
 * 
 * Speeds up view time by allowing the user to simply view the page before images are loaded
 * 
 * @param {*} id 
 * @returns 
 */
export async function createBackgroundImages(id) {
  logger.info(`Creating background images for ${id}`);
  if (!id) {
    throw new Error("Cannot have invalid ID");
  }

  const newJSON = await getTripById(id);
  var tripJSON;
  try {
    tripJSON = tripSchema.parse(newJSON);
  } catch (err) {
    logger.error("Could not parse retrieved trip", err);
    throw new Error("Could not parse retrieved trip");
  }

  logger.debug("Creating images in the background...");
  var count = 0;

  for (let day of tripJSON.days) {
    for (let stop of day.stops) {
      try {
        // Already defined
        if (stop.picture) {
          continue;
        }

        // No search terms
        if (!stop.pictureSearchTerms) {
          continue;
        }

        count += 1;
        stop.picture = await generateImage(stop.pictureSearchTerms, true);
      } catch (err) {
        logger.error(`Failed to generate image for ${stop.pictureSearchTerms}`, err);
        continue;
      }
    }
  }

  logger.debug(`Generated ${count} images so far`);

  if (count > IMAGE_SUGGESTED_LIMIT) {
    logger.debug(`Since image count is over suggested limit (${IMAGE_SUGGESTED_LIMIT}), not generated for additional`);
    return await updateTrip(tripJSON) 

  }
  logger.debug("Generating additional images...");

  for (let add of tripJSON.additional) {
    try {
      // Already defined
      if (add.picture) {
        continue;
      }

      // No search terms
      if (!add.pictureSearchTerms) {
        continue;
      }

      count += 1;
      add.picture = await generateImage(add.pictureSearchTerms, true);
    } catch (err) {
      logger.error(`Failed to generate image for ${add.pictureSearchTerms}`, err);
      continue;
    }
  }

  logger.info(`Finished. Generated ${count} images`)
  return await updateTrip(tripJSON) 

}
