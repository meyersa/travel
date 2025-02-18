import { afterAll, beforeAll, expect, test } from "vitest";
import { initMongo } from "./mongo.js";
import { configDotenv } from "dotenv";
import { saveImage, getImage, deleteImage } from "./handleImages.js";
import { generateImageId } from "./populateImages.js";

configDotenv();

const { MONGO_DB, MONGO_URL } = process.env;

// Init DB connection
let db, photosDB, imageId;
beforeAll(async () => {
  db = await initMongo(MONGO_URL, MONGO_DB);
  imageId = generateImageId("A".repeat(64));

});

// Close DB connection
afterAll(async () => {
  db.client.close;
});

test("Save Image", async () => {
    const imageUrl = "https://picsum.photos/200";
    const result = await saveImage(db, imageUrl, imageId)

    expect(result).toBe(`/api/images?id=${imageId}`)
})

test("Get Image", async () => {
    const imageBuffer = await getImage(db, imageId);

    expect(imageBuffer).toBeInstanceOf(Buffer);
    expect(imageBuffer.length).toBeGreaterThan(0);

})

test("Delete image", {timeout: 30000}, async () => {
    const result = await deleteImage(db, imageId);

    expect(result).toBe(`Deleted image with ID: ${imageId}`)
})
