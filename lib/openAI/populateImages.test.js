import { expect, test } from "vitest";
import { getImageOAI, initOpenAI } from "./populateImages.js";
import { configDotenv } from "dotenv";
configDotenv();

// Costs money
test("Create image", {timeout: 30000}, async () => {
    const image = await getImageOAI("Machu Picchu", 11, false)

    console.log(image)

    expect(image.length).greaterThan(15)
})