import { initOpenAI } from "./openai.js";
import { saveImage } from "../mongo/images.js";
import { generateImageId } from "../util.js";
import { logger } from "../logger.js";

const client = initOpenAI();

/**
 * Get an image from DALLE 3
 * @param {String} query - The input query for image
 * @param {boolean} [save=false] - Whether to save the image to Mongo
 * @param {boolean} [important=false] - If the image is important and needs higher quality
 * @returns {String} - String if image made, false if failed
 */
export async function generateImage(query, save = false, important = false) {
  logger.info(`Generating image for ${query}`);

  // Emphasize web styling
  query +=
    "\nMake image vivid, in the style of a travel website. They should be of general landscape views of something. For example, Machu Picchu would be like a drone shot, whereas the Chicago Bean would be a smartphone camera picture.";

  // Slightly higher quality if important is set (i.e. cover image)
  var response;
  if (important) {
    logger.debug("Using dall-e-3")
    response = await client.images.generate({
      model: "dall-e-3",
      prompt: query,
      n: 1,
      size: "1024x1024",
    });
  } else {
    response = await client.images.generate({
      model: "dall-e-2",
      prompt: query,
      n: 1,
      size: "1024x1024",
    });
  }
  
  // Ensure image was produced
  if (!response) {
    logger.warn("Unable to find search results");
    return null;
  }
  const responseURL = response.data[0].url;
  logger.info(`Generated image for ${query}: ${responseURL}`);

  // Don't save
  if (!save) {
    return responseURL;
  }

  return await saveImage(responseURL, generateImageId(query + Date.now()));
}