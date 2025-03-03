import OpenAI from "openai";
import { expect, test } from "vitest";
import { initOpenAI } from "./openai";

// Create OpenAI object
test("Create OpenAI", () => {
  expect(initOpenAI()).toBeInstanceOf(OpenAI);
});
