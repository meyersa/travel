import { parseShortTime, compareShortTime } from "./shortTime.js";

const maxChar = 300;
const minChar = 5;

function validateText(text) {
  if (text.length > maxChar) {
    throw new Error(`Text field over max char amount`);
  }

  if (text.length < minChar) {
    throw new Error(`Text field under max char amount`);
  }

  return true;
}

export async function validateTrip(tripJSON) {
  /*
   * Validations:
   *
   * 1. Should contain well known information (not empty)
   *    - id
   *    - name
   *    - startDate
   *    - endDate
   *    - description
   *    - pictureUrl
   *    - days
   *
   * 2. Text fields should be less than 300 chars and more than 5
   *    - Includes name, description
   *
   * 3. ID Should be valid
   *    - Contains no whitespace (link safe)
   *    - More than 5 characters, but less than 150
   *
   * 4. Dates are valid
   *    - Should be parseable
   *    - endDate should be after startDate
   *    - Amount of days based on time should equal days present in days array
   *    - Amount of days should be more than 1 (eg. different start/end) but less than a month (30 days)
   *
   * 5. Days should be valid
   *    - Days should be a list of dictionaries greater than 0
   *    - Each day should contain a valid date, that falls sequentially into the start/end dates
   *    - Each day should contain a list of stops
   *
   * 6. Stops should be valid
   *    - Each stop should contain a valid start/end time
   *    - Stop times should not overlap
   *    - Each stop should contain a valid lat/long
   *    - Each stop should contain a name and description that is less than 300 chars
   *
   * 7. If present, additional should be validated
   *    - Should be a dictionary of more than 1 entries if present
   *    - Each entry should have a title that is less than 300 chars
   *    - Each entry should have at least 1 point
   *    - Each point should be less than 300 chars
   */
  console.log("Received request to validate JSON...")

  if (!tripJSON) {
    throw new Error("Trip JSON cannot be empty");
  }

  // Validate required fields exist
  const requiredFields = ["id", "name", "startDate", "endDate", "description", "pictureUrl", "days"];
  for (let field of requiredFields) {
    if (!tripJSON[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  console.log(`Processing Trip name: ${tripJSON.name}`)

  // Validate ID
  const id = tripJSON["id"];
  if (id.length < 5 || id.length > 150) {
    throw new Error("ID length is not valid");
  }
  if (/\s/.test(id)) {
    throw new Error("ID cannot have whitespace");
  }

  // Validate startDate/endDate
  const startDate = new Date(tripJSON["startDate"]);
  const endDate = new Date(tripJSON["endDate"]);

  if (isNaN(startDate) || isNaN(endDate)) {
    throw new Error("Invalid startDate or endDate");
  }

  if (endDate <= startDate) {
    throw new Error("endDate must be after startDate");
  }

  const numDays = (endDate - startDate) / (24 * 60 * 60 * 1000); // Milliseconds in day

  if (numDays < 1) {
    throw new Error("Trip must be longer than a day");
  }

  if (numDays > 31) {
    throw new Error("Trip must be less than a month");
  }

  // Validate days
  const days = tripJSON.days;

  if (days.length < numDays) {
    throw new Error("Trip must include the same amount of days as dates");
  }

  for (let i = 0; i < days.length; i++) {
    const day = days[i];

    validateText(day.name);
    validateText(day.description);

    // Validate stops
    if (!day.stops.length > 0) {
      throw new Error("Day does not have any stops");
    }
    for (let j = 0; j < day.stops.length; j++) {
      const stop = day.stops[j];

      validateText(stop.name);
      validateText(stop.description);

      if (!stop.lattitude || !stop.longitude) {
        throw new Error("Stop is missing lat/long");
      }

      if (
        isNaN(parseFloat(stop.lattitude)) ||
        isNaN(parseFloat(stop.longitude)) ||
        stop.lattitude < -90 ||
        stop.lattitude > 90 ||
        stop.longitude < -180 ||
        stop.longitude > 180
      ) {
        throw new Error("Invalid lat/long values");
      }

      const parsedStart = parseShortTime(stop.startTime);
      const parsedEnd = parseShortTime(stop.endTime);

      if (compareShortTime(parsedEnd, parsedStart) != 1) {
        throw new Error("Invalid stop start/end time");
      }

      // Compare previous stop end
      if (j > 0) {
        const previousEnd = parseShortTime(day.stops[j - 1].endTime);

        if (compareShortTime(parsedStart, previousEnd) == -1) {
          throw new Error("Stop time conflicts with previous stop");

        }
      }
    }

    // Validate trip day
    const dayDate = new Date(day.date);

    if (startDate > dayDate || dayDate > endDate) {
      throw new Error("Day date does not fit in range");
    }

    if (i > 0 && new Date(day.date) <= new Date(days[i - 1].date)) {
      throw new Error("Days must be in sequential order");
    }
  }

  // Validate text fields
  validateText(tripJSON.name);
  validateText(tripJSON.description);

  // Validate additional (if present)
  const additional = tripJSON["additional"];
  if (additional) {
    for (const item of additional) {
      const { title, points } = item;

      validateText(title);

      if (!title || !Array.isArray(points) || points.length === 0) {
        throw new Error("Additional parameters are not valid");
      }

      for (let point of points) {
        validateText(point);
      }
    }
  }

  console.log(`Processed Trip ${tripJSON.name}`)
  
  return true;
}
