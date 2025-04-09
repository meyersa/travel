import { expect, test } from "vitest";
import { generateImage } from "./generateImages.js";

// Costs money :(
test("Create image", {timeout: 30000}, async () => {
    const image = await generateImage("Machu Picchu", false, false)
    expect(image.length).greaterThan(15)

})