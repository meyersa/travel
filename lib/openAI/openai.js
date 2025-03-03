import OpenAI from "openai";
import { configDotenv } from "dotenv";
configDotenv();

const { OPENAI_KEY } = process.env;

/*
 * Create OpenAI object and validate Token
 */
export function initOpenAI() {
  console.log("Checking OpenAI ENVs");

  if (OPENAI_KEY.length < 10) {
    throw new Error("Invalid OpenAI Key");
  }
  if (!OPENAI_KEY) {
    throw new Error("Missing OpenAI Key");
  }

  console.log("OpenAI ENVs Passed");
  return new OpenAI({ apiKey: OPENAI_KEY });
}
