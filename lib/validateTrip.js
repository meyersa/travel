export async function validateTrip(tripJSON) {
  /*
   * Trip should contain some well known information
   * - "id": between 5 to 150 chars, and not contain whitespace
   * - "name"
   * - "startDate"
   * - "endDate"
   * - "description"
   * - "pictureUrl"
   * - "days": list greater than 0, and same amount of days as start/end
   *
   * Actual "days" should include a title, optional pictureUrl, and at least one point
   *
   * All text fields should be less than 300 chars
   *
   * additional is optional, but will require a title, and points (greater than 0)
   */
  const maxChar = 300 

  if (!tripJSON) {
    throw new Error("Trip JSON cannot be empty");
  }

  // Validate required fields exist
  const requiredFields = [ "id", "name", "startDate", "endDate", "description", "pictureUrl", "days" ]
  for (let field of requiredFields) {
    if (!tripJSON[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate ID
  const id = tripJSON["id"]
  if (id.length < 5 || id.length > maxChar / 10) {
    throw new Error("ID length is not valid");
  }
  if (/\s/.test(id)) {
    throw new Error("ID cannot have whitespace")
  }

  // Validate startDate/endDate
  const startDate = new Date(tripJSON["startDate"])
  const endDate = new Date(tripJSON["endDate"])

  if (isNaN(startDate) || isNaN(endDate)) {
    throw new Error("Invalid startDate or endDate")

  }

  if (endDate <= startDate) {
    throw new Error("endDate must be after startDate");
  }

  const numDays = (endDate - startDate) / (24 * 60 * 60 * 1000); // Milliseconds in day

  if (numDays < 1) {
    throw new Error("Trip must be longer than a day")
    
  }
  
  if (numDays > 31) {
    throw new Error("Trip must be less than a month")
    
  }

  // Validate days 
  const days = tripJSON.days;

  if (days.length < numDays) {
    throw new Error("Trip must include the same amount of days as dates")

  }

  for (let day of days) {
    if (day.name.length > maxChar || day.description.length > maxChar) {
      throw new Error("Text field over max char amount")

    } 
    if (!day.stops.length > 0) {
      throw new Error("Day does not have any stops")

    }

    // TODO: Date check
    // const dayDate = new Date(day.date)

  }

  // Validate text fields
  if (tripJSON.name.length > maxChar || tripJSON.description.length > maxChar) {
    throw new Error("Text field over max char amount")

  } 

  // Validate additional (if present)
  const additional = tripJSON["additional"]
  if (additional) {
    for (const item of additional) {
      const { title, points } = item;
      if (!title || !Array.isArray(points) || points.length === 0) {
        throw new Error("Additional parameters are not valid");
      }
    }
  }

  return true;
}
