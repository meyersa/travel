export function parseShortTime(time) {
  /*
   * Parse short time - E.g. "2:00PM"
   *
   * Returns hours, minutes, half("AM/PM")
   *
   * Valid formats:
   *  - 1:00PM
   *  - 1PM
   *  - 13:00
   *  - 13
   */
  var timeStr = String(time).trim().toLowerCase();

  // Quick check to be less than the most char possible for time
  if (timeStr.length > 8) {
    throw new Error(`Invalid time format, length over 8 ${timeStr}`);
  }

  // Match basic groups for later
  const timeRegex = "^([0-2]?[0-9]):?([0-6][0-9])? ?(am|pm)?$";
  const match = timeStr.match(timeRegex);

  // Again easy check to eliminate before more comparisons
  if (!match || match.length != 4) {
    throw new Error(`Invalid time format, more than 4 matches ${timeStr}`);
  }

  // Assign regex matches
  let hour, minute, half;
  hour = match[1];
  minute = match[2] ? match[2] : 0;
  half = match[3];

  // Needs to always have an hour
  if (!hour) {
    throw new Error("Invalid time format, missing hour");
  }

  // Figure out half logic
  if (!half) {
    if (hour > 12) {
      half = 2;
      hour = hour - 12;
    } else {
      half = 1;
    }
  } else if (half == "am") {
    half = 1;
  } else if (half == "pm") {
    half = 2;
  } else {
    throw new Error("Invalid time format, no AM/PM designator");
  }

  // Cleanup
  if (String(hour).startsWith(0)) {
    hour = String(hour).charAt(1);
  }

  hour = parseInt(hour);
  minute = parseInt(minute);

  // Side-effect
  if (hour == 12) {
    hour = 0;

  }

  // Final checks for valid values
  if (0 > minute || minute > 60) {
    throw new Error("Invalid time format, minutes not 0-60");
  }

  if (0 > hour || hour > 12) {
    throw new Error("Invalid time format, hours not 0-12");
  }

  if (half != 1 && half != 2) {
    throw new Error("Invalid time format, AM/PM not set");
  }

  return { hour, minute, half };
}

// Really starting to think at this point I should have just added times to an abitrary date, e.g. 1970-1-1 to do this easier...

export function compareShortTime(timeArr1, timeArr2) {
  /*
   * Compare two short time arrays
   * Returns -1 for earlier, 1 for later, 0 for same
   */
  const { hour: hour1, minute: minute1, half: half1 } = timeArr1;
  const { hour: hour2, minute: minute2, half: half2 } = timeArr2;
  var out;

  // Suppose one is AM other is PM
  if (half1 != half2) {
    return half1 > half2 ? 1 : -1;
  }

  // Compare hours
  if (hour1 != hour2) {
    return hour1 > hour2 ? 1 : -1;
  }

  if (minute1 != minute2) {
    return minute1 > minute2 ? 1 : -1;
  }

  // Same
  return 0;
}
