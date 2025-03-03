import crypto from "node:crypto";

/*
 * Create an image Hash from the query
 */
export function generateImageId(query) {
  return crypto.createHash("sha256").update(query).digest("hex").substring(0, 24);
}

export function cleanAndVerify(value, minLength = 5, maxLength = 300) {
  if (!value) {
    throw new Error("Input value is invalid");
  }

  value = String(value).trim();
  if (value.length < minLength) {
    throw new Error("Input value is too short");
  }
  if (value.length > maxLength) {
    throw new Error("input value is too long");
  }

  return value;
}

// Basic log for information, can add more with more headers
export async function preFlightLog(req) {
  let output = `Received request on ${req.path}`;

  if (req.query) {
    output += `, with queries ${JSON.stringify(req.query)}`;
  }

  if (req.body.length > 1) {
    output += `, and a body`;
  }

  console.log(output);
  return output;
}
