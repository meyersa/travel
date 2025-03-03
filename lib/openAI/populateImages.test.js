import { expect, test } from "vitest";
import { getImageOAI, initOpenAI } from "./populateImages.js";
import OpenAI from "openai";
import { configDotenv } from "dotenv";
configDotenv();

const { OPENAI_KEY } = process.env;

test("Create OpenAI", () => {
  expect(initOpenAI(OPENAI_KEY)).toBeInstanceOf(OpenAI);
});

// Costs money
// test("Create image", {timeout: 30000}, async () => {
//     const client = initOpenAI(OPENAI_KEY)
//     const image = await getImageOAI(client, "Machu Picchu", 11, false)

//     console.log(image)

//     expect(image.length).greaterThan(15)
// })