import axios from "axios";
import { GridFSBucket } from "mongodb";
import { ObjectId } from "mongodb";
import { initMongo } from "./mongo.js";
import { getCache, setCache, resetCache } from "../cache.js";
import { logger } from "../logger.js";

const mongoDB = await initMongo()
const bucket = new GridFSBucket(mongoDB, { bucketName: "images" });

/**
 * Save image from a URL
 * @param {string} imageUrl - The image URl to save from 
 * @param {string} imageId - The image name to save to
 * @returns {Promise<String>} - Image link or error on failure
 * @throws {Error} - When inputs are missing
 */
export async function saveImage(imageUrl, imageId) {
  if (!imageUrl || !imageId) {
    throw new Error("Missing values");
  }

  // Return promise - starts download
  return new Promise(async (resolve, reject) => {
    logger.info(`Saving image ${imageId}`);

    try {
      const response = await axios({
        method: "GET",
        url: imageUrl,
        responseType: "stream",
      });

      const uploadStream = bucket.openUploadStreamWithId(
        ObjectId.createFromHexString(imageId),
        imageUrl
      );
      response.data.pipe(uploadStream);
      uploadStream.on("finish", () => {
        resolve(`/api/images?id=${imageId}`)
        
      });
      uploadStream.on("error", (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Retrieves images by their ID from MongoDB
 * @param {String} fileId - The input fileID to download
 * @returns {Promise<Buffer>} - Image buffer to serve
 * @throws {Error} - When inputs are invalid
 */
export async function getImage(fileId) {
  if (!fileId) {
    throw new Error("FileID cannot be null")

  }

  const cached = getCache(fileId);
  if (cached) return cached;

  return new Promise((resolve, reject) => {
    let buffer = Buffer.alloc(0);
    const downloadStream = bucket.openDownloadStream(ObjectId.createFromHexString(fileId));

    downloadStream
      .on("data", (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
      })
      .on("end", () => {
        setCache(fileId, buffer); // Cache the buffer
        resolve(buffer); // Return the full buffer
      }) 
      .on("error", (err) => reject(err));
  });
}

/**
 * Deletes an image by its ID from MongoDB GridFS
 * @param {String} fileId - The Image to delete 
 * @returns {String} - Confirmation of image deletion
 * @throws {Error} - When Image fails to delete or input is invalid
 */
export async function deleteImage(fileId) {
  if (!fileId) {
    throw new Error("Missing values");
  }

  try {
    await bucket.delete(ObjectId.createFromHexString(fileId)); // Ensure this is the right syntax for your driver version
    resetCache(fileId); // Invalidate cache

    return `Deleted image with ID: ${fileId}`;
  } catch (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}
