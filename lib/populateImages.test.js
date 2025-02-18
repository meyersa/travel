import { expect, test } from "vitest";
import { getImage, initOpenAI } from "./populateImages.js";
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
//     const image = await getImage(client, "Machu Picchu")

//     expect(image.length).greaterThan(15)
// })