import { expect, test } from "vitest";
import { initOpenAI, Generate, verifyDefaults, buildSystemMessage, buildUserMessage, generate } from "./queryOpenAI.js";
import OpenAI from "openai";
import { configDotenv } from "dotenv";
configDotenv();

const { OPENAI_KEY } = process.env;

test("Create OpenAI", () => {
  expect(initOpenAI(OPENAI_KEY)).toBeInstanceOf(OpenAI);
});

test("Fail to Create OpenAI", () => {
  expect(() => initOpenAI("")).toThrowError(Error("Missing OpenAI Key"));
});

test("Check defaults", () => {
  expect(verifyDefaults()).toBe(true);
});

test("Check system output", () => {
  expect(buildSystemMessage().role).toEqual("system");
  expect(buildSystemMessage().content.length).greaterThan(100);
});

test("Check user output", () => {
  const body = {
    where: "testtt",
    when: "testtt",
    description: "testttt",
  };

  expect(buildUserMessage(body).role).toEqual("user");
  expect(buildUserMessage(body).content.length).greaterThan(30);
});

// Costs money !
// test("Query ChatGPT", { timeout: 30000 }, async () => {
//   const body = {
//     where: "Las Vegas - National Park tour",
//     when: "Sometime this summer for 7 days",
//     description:
//       "I'd like to do the national park tour from Vegas. This should include the grand canyon, valley of fire, and zion. I'd also like to start and end in Vegas.",
//   };
//   const response = await generate(body, OPENAI_KEY);
//   expect(response.length).greaterThan(50);

// });
