import OpenAI from "openai";
import defaultTemplate from "../template.json" assert {type: "json"};
import { defaultPrompt } from "../prompt.js";

/*
 * Before calling, make sure both values exist
 */
export function verifyDefaults() {
  // Check template is dict
  if (!defaultTemplate || defaultTemplate.constructor != Object) {
    throw new Error("Default trip template is missing");
  }

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
 * Build system message with incoming template or without
 */
export function buildSystemMessage(template = null) {
  if (!template) {
    template = defaultTemplate;
  }

  return {
    role: "system",
    content: JSON.stringify(`${defaultPrompt}\n\n\n${template}`),
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

export async function generate(body, OPENAI_KEY, template = null) {
  const client = initOpenAI(OPENAI_KEY);

  // Make sure these are good before proceeding
  verifyDefaults();

  // Create messages
  const systemMessage = buildSystemMessage(template);
  const userMessage = buildUserMessage(body);

  // Query ChatGPT
  try {
    /*
     * Could use metrics here 
     * https://platform.openai.com/docs/api-reference/chat/object
     */

    const response = await client.chat.completions.create({
      messages: [systemMessage, userMessage],
      model: "gpt-4o-mini",
    });

    const tokens = response.usage.total_tokens;     
    console.log(`Used ${tokens} tokens`)

    const message = response.choices[0].message.content;
    console.log(`Received back a response with length ${message.length}`)
    
    return message;

  } catch (err) {
    console.error("OpenAI request failed:", err);
    throw new Error("Failed to query ChatGPT");

  }
}
