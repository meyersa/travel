import { newTrip } from "../schema/newTrip";
import { addTrip, getTripById, populateFail, updateTrip } from "./mongo/trips";
import { generateTrip } from "./openAI/generateTrip";
import { tripSchema } from "../schema/tripSchema";
import { generateImage } from "./openAI/generateImages";

const { IMAGE_SUGGESTED_LIMIT = 5 } = process.env;

// Method to delete trip

// Create trip workflow

// Delete trip

// Refresh trip

/**
 * Handle Failure for trip creation
 * @param {String} ID - Failed ID to handle
 * @returns {Boolean} - Status of fail (true for success)
 */
export async function handleFail(id) {
  console.warn(`Handling failure for ${id}`);

  // This is already a fail case, so not much can be done
  if (!id) {
    console.error("Invalid ID sent in for handleFail?");
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
export async function createTrip(body) {
  console.log(`Creating trip with given input ${body.id}`);

  // Validate Input
  let parsedBody;
  try {
    parsedBody = newTrip.parse(body);
  } catch (err) {
    console.error("Failed to parse body with Zod", err);
    throw new Error("Could not parse body");
  }

  // Generate trip
  let tripJSON;
  try {
    let generatedJSON = await generateTrip(body);
    tripJSON = tripSchema.parse(generatedJSON);
  } catch (err) {
    console.error("Failed to get a trip JSON from ChatGPT", err);
    throw new Error("Could not retrieve trip from ChatGPT");
  }

  // Generate title image
  try {
    tripJSON.picture = await generateImage(tripJSON.pictureSearchTerms, true);
  } catch (err) {
    console.error("Failed to generate trip image with Dalle", err);
    throw new Error("Could not generate title image");
  }

  // Spawn background task to finish rest of images and save to Mongo via update trip

  // Save
  // TODO: Save body as well for remaking it
  return addTrip(tripJSON);

  // When error, create populateFail
}

export async function createBackgroundImages(id, background_cont = true) {
  console.log(`Creating background images for ${id}`);
  if (!id) {
    throw new Error("Cannot have invalid ID");
  }

  const newJSON = await getTripById(id);
  var tripJSON;
  try {
    tripJSON = tripSchema.parse(newJSON);
  } catch (err) {
    console.error("Could not parse retrieved trip", err);
    throw new Error("Could not parse retrieved trip");
  }

  console.log("Creating images in the background...");
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
        console.error(`Failed to generate image for ${stop.pictureSearchTerms}`, err);
        continue;
      }
    }
  }

  console.log(`Generated ${count} images so far`);

  if (count > IMAGE_SUGGESTED_LIMIT) {
    console.log(`Since image count is over suggested limit (${IMAGE_SUGGESTED_LIMIT}), not generated for additional`);
    return await updateTrip(tripJSON) 

  }
  console.log("Generating additional images...");

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
      console.error(`Failed to generate image for ${add.pictureSearchTerms}`, err);
      continue;
    }
  }

  console.log(`Finished. Generated ${count} images`)
  return await updateTrip(tripJSON) 

}
