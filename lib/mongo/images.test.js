import { expect, test, describe } from "vitest";
import { saveImage, getImage, deleteImage } from "./images.js";
import { generateImageId } from "../util.js";

describe("Test Mongo Image Suite", async () => {
  const imageId = generateImageId("A".repeat(64));

  test("Save Image", async () => {
    const imageUrl = "https://picsum.photos/200";
    const result = await saveImage(imageUrl, imageId);

    expect(result).toBe(`/api/images?id=${imageId}`);
  });

  test("Get Image", async () => {
    const imageBuffer = await getImage(imageId);

    expect(imageBuffer).toBeInstanceOf(Buffer);
    expect(imageBuffer.length).toBeGreaterThan(0);
  });

  test("Delete image", { timeout: 30000 }, async () => {
    const result = await deleteImage(imageId);

    expect(result).toBe(`Deleted image with ID: ${imageId}`);
  });
});
