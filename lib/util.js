import crypto from "node:crypto";

/**
 * Create an image Hash from the query
 * @param {String} query - Query to generate hash for
 * @returns {String} - Hash
 */
export function generateImageId(query) {
  return crypto.createHash("sha256").update(query).digest("hex").substring(0, 24);
}

/**
 * Clean and verify text
 * @param {String} value - Value to verify 
 * @param {Number} [minLength=5] - Minimum length of string
 * @param {Number} [maxLength=300] - Maximum length of string
 * @returns {String} - Cleaned value after being proven
 * @throws {Error} - When value does not meet specifications
 */
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

/**
 * Logs default information when a request comes in
 * @param {*} req - Request for headers to be examined on
 * @returns {String} - Log
 */
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

/**
 * Parses short time into readable format
 * @param {String} time - Time to be parsed
 * @returns {String} - Short formatted time
 * @throws {Error} - When value cannot be parsed
 */
export function parseShortTime(time) {
  let timeStr = String(time).trim().toLowerCase();

  if (timeStr === "noon") {
    throw new Error("Invalid time format, more than 4 matches noon");
  }

  // Regex to match valid time formats (e.g., "9am", "12:30pm", "-")
  const timeRegex = /^(-|0?[1-9]|1[0-2])(:([0-5][0-9]))?\s?(am|pm)?$/i;
  const match = timeStr.match(timeRegex);

  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  // Handle "-" as a special case
  if (timeStr === "-") {
    return { hour: -1, minute: -1, half: null }; // Use -1 to indicate no valid time
  }

  let hour = parseInt(match[1], 10);
  let minute = match[3] ? parseInt(match[3], 10) : 0;
  let period = match[4] ? match[4].toLowerCase() : null;

  if (hour < 1 || hour > 12) {
    throw new Error("Invalid time format, hours not 1-12");
  }

  if (minute < 0 || minute > 59) {
    throw new Error("Invalid time format, minutes not 0-59");
  }

  if (!period) {
    throw new Error("Invalid time format, no AM/PM designator");
  }

  return { hour, minute, half: period };
}


/**
 * Compare to short times
 * @param {String} time1 - First time to compare 
 * @param {String} time2 - Second time to compare 
 * @returns {number} - -1 for earlier, 1 for later, 0 for same
 */
export function compareShortTime(time1, time2) {
  const { hour: hour1, minute: minute1, half: half1 } = parseShortTime(time1);
  const { hour: hour2, minute: minute2, half: half2 } = parseShortTime(time2);

  // Convert to 24-hour format
  const time1_24 = hour1 % 12 + (half1 === "pm" ? 12 : 0);
  const time2_24 = hour2 % 12 + (half2 === "pm" ? 12 : 0);

  // Compare hours first
  if (time1_24 !== time2_24) {
    return time1_24 > time2_24 ? 1 : -1;
  }

  // Compare minutes
  if (minute1 !== minute2) {
    return minute1 > minute2 ? 1 : -1;
  }

  return 0; // They are the same time
}
