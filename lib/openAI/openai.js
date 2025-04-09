import OpenAI from "openai";
import { configDotenv } from "dotenv";
import { logger } from "../logger.js";

configDotenv();
const { OPENAI_KEY } = process.env;

/**
 * Create OpenAI object and validate Token
 * @returns {OpenAI} - OpenAI object to query
 * @throws {Error} - When inputs are invalid
 */
export function initOpenAI() {
  logger.info("Checking OpenAI ENVs");

  if (OPENAI_KEY.length < 10) {
    throw new Error("Invalid OpenAI Key");
  }
  if (!OPENAI_KEY) {
    throw new Error("Missing OpenAI Key");
  }

  logger.info("OpenAI ENVs Passed");
  return new OpenAI({ apiKey: OPENAI_KEY });
}
