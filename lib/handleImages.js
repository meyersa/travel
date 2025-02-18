import axios from "axios";
import { GridFSBucket } from "mongodb";
import { ObjectId } from "mongodb";

/*
 * Save image from a URL
 *
 * Given the MongoDB collection where it should be saved, this downloads the image
 */
export async function saveImage(mongoDB, imageUrl, imageId) {
  if (!mongoDB || !imageUrl || !imageId) {
    throw new Error("Missing values");
  }
  const bucket = new GridFSBucket(mongoDB, { bucketName: "images" });

  return new Promise(async (resolve, reject) => {
    console.log(`Saving image ${imageId}`);

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

      uploadStream.on("finish", () => resolve(`/api/images?id=${imageId}`));
      uploadStream.on("error", (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
}

/*
 * Retrieves images by their ID from MongoDB
 */
export async function getImage(mongoDB, fileId) {
  const bucket = new GridFSBucket(mongoDB, { bucketName: "images" });

  return new Promise((resolve, reject) => {
    let buffer = Buffer.alloc(0);
    const downloadStream = bucket.openDownloadStream(ObjectId.createFromHexString(fileId));

    downloadStream
      .on("data", (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
      })
      .on("end", () => resolve(buffer)) // Return the full buffer
      .on("error", (err) => reject(err));
  });
}

/*
 * Deletes an image by its ID from MongoDB GridFS
 */
export async function deleteImage(mongoDB, fileId) {
  if (!mongoDB || !fileId) {
    throw new Error("Missing values");
  }

  const bucket = new GridFSBucket(mongoDB, { bucketName: "images" });

  try {
    await bucket.delete(ObjectId.createFromHexString(fileId)); // Ensure this is the right syntax for your driver version
    return `Deleted image with ID: ${fileId}`;
  } catch (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}
