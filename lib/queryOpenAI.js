import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { defaultPrompt } from "../prompt.js";
import { tripSchema } from "../template.js"

/*
 * Before calling, make sure both values exist
 */
export function verifyDefaults() {
  // Check prompt is there
  if (!defaultPrompt || defaultPrompt.length < 50) {
    throw new Error("Default prompt is missing");
  }
  return true;
}

/*
 * Create OpenAI object and validate Token
 */
export function initOpenAI(OPENAI_KEY) {
  if (!OPENAI_KEY || OPENAI_KEY.length < 10) {
    throw new Error("Missing OpenAI Key");
  }
  return new OpenAI({ apiKey: OPENAI_KEY });
}

/*
 * Build system message
 */
export function buildSystemMessage(template = null) {
  return {
    role: "system",
    content: JSON.stringify(defaultPrompt),
  };
}

/*
 * Stringify body dictionary into input
 */
export function buildUserMessage(body) {
  if (!body || body.constructor != Object) {
    throw new Error("Body cannot be empty");
  }

  if (!body.where || !body.when || !body.description) {
    throw new Error("Body is missing fields");
  }

  return {
    role: "user",
    content: JSON.stringify(`When: ${body.when}\nWhere: ${body.where}\n${body.description}`),
  };
}

export async function generate(body, OPENAI_KEY) {
  console.log("Generating Trip JSON")

  const client = initOpenAI(OPENAI_KEY);

  // Make sure these are good before proceeding
  verifyDefaults();

  // Create messages
  const systemMessage = buildSystemMessage();
  const userMessage = buildUserMessage(body);

  console.log("Chat request assembled, querying...")
  try {
    /*
     * Could use metrics here 
     * https://platform.openai.com/docs/api-reference/chat/object
     */

    const response = await client.chat.completions.create({
      messages: [systemMessage, userMessage],
      model: "gpt-4o",
      response_format: zodResponseFormat(tripSchema, "trip"),
    });

    const message = response.choices[0].message.parsed;
    console.log(`Received back a response with length ${message.length}`)
    
    const tokens = response.usage.total_tokens;     
    console.log(`Used ${tokens} tokens`)

    console.log(message); 

    return message;

  } catch (err) {
    console.error("OpenAI request failed:", err);
    throw new Error("Failed to query ChatGPT");

  }
}
