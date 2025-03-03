import { zodResponseFormat } from "openai/helpers/zod";
import { defaultPrompt } from "../../prompt.js";
import { tripSchema } from "../../template.js"
import { initOpenAI } from "./openai.js";
import { validateTrip } from "../tripValidation/validateTrip.js"

const CHATGPT_MODEL = "gpt-4o-mini"
const CHATGPT_RETRIES = 3 

const client = initOpenAI();

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
 * Build system message
 */
export function buildSystemMessage(failMessage= NaN) {
  var content = [defaultPrompt]

  if (failMessage) {
    content.push(`\nThe previous result failed validation for: ${failMessage}`)

  }
  return {
    role: "system",
    content: JSON.stringify(content),
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

/*
 * Query ChatGPT to make tripJSON
 */
export async function generateTrip(body) {
  console.log("Generating tripJSON from ChatGPT")

  // Ensure these before proceeding
  verifyDefaults()

  // Start at one attempt
  var chatAttemps = 0
  var failMessage = null

  while (chatAttemps < CHATGPT_RETRIES) {
    // Increment
    chatAttemps += 1 
    console.log(`Query attempt #${chatAttemps}`)

    // Create messages
    const systemMessage = buildSystemMessage(chatAttemps, failMessage);
    const userMessage = buildUserMessage(body);

    // Query ChatGPT
    var rawJSON;
    try {
      /*
       * Could use metrics here 
       * https://platform.openai.com/docs/api-reference/chat/object
       */
      const response = await client.chat.completions.create({
        messages: [systemMessage, userMessage],
        model: CHATGPT_MODEL,
        response_format: zodResponseFormat(tripSchema, "trip"),
      });

      rawJSON = response.choices[0].message.content;
      console.log(`Received back a response with length ${rawJSON.length}`)
      
      const tokens = response.usage.total_tokens;     
      console.log(`Used ${tokens} tokens`)
        
    } catch (err) {
      console.error("Failed to query ChatGPT", err)
      continue

    }

    // Validate Response
    try {
      var parsedJSON = JSON.parse(rawJSON) 

      // Pass through ID
      parsedJSON["id"] = body.id 

      const tripJSON = validateTrip(parsedJSON)
      return tripJSON

    } catch (err) {
      console.error("Failed to validate JSON", err) 
      failMessage = err
      continue

    }
  }
  console.error(`Unable to generate trip after ${CHATGPT_RETRIES} attempts`, err)
  throw new Error("Unable to generate trip")

}
