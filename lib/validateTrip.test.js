import { expect, test } from "vitest";
import { validateTrip } from "./validateTrip.js";

const goodJSON = {
  "id": "asdlkfjasdflkjasdf",
  "name": "San Francisco Getaway",
  "startDate": "2025-04-16",
  "endDate": "2025-04-19",
  "latitude": "35.190",
  "longitude": "-122.446",
  "description": "A short but eventful trip exploring the iconic sights and culture of San Francisco.",
  "pictureSearchTerms": "Golden Gate Bridge",
  "days": [
      {
          "name": "Day 1: Arrival and Golden Gate",
          "date": "2025-04-16",
          "description": "Arrive in San Francisco and visit the world-famous Golden Gate Bridge.",
          "stops": [
              {
                  "name": "Golden Gate Bridge",
                  "startTime": "2pm",
                  "endTime": "5pm",
                  "latitude": "37.8199",
                  "longitude": "-122.4783",
                  "description": "Walk across the Golden Gate Bridge and enjoy stunning views of the bay.",
                  "pictureSearchTerms": "Golden Gate Bridge at Sunset"
              }
          ]
      },
      {
          "name": "Day 2: Alcatraz and Fisherman's Wharf",
          "date": "2025-04-17",
          "description": "Explore Alcatraz Island in the morning and enjoy the bustling Fisherman's Wharf in the afternoon.",
          "stops": [
              {
                  "name": "Alcatraz Island",
                  "startTime": "9am",
                  "endTime": "12pm",
                  "latitude": "37.8267",
                  "longitude": "-122.4233",
                  "description": "Take a ferry to Alcatraz and tour the historic prison.",
                  "pictureSearchTerms": "Alcatraz Island"
              },
              {
                  "name": "Fisherman's Wharf",
                  "startTime": "2pm",
                  "endTime": "5pm",
                  "latitude": "37.8080",
                  "longitude": "-122.4177",
                  "description": "Enjoy fresh seafood, shopping, and street performances at Fisherman's Wharf.",
                  "pictureSearchTerms": "Fisherman's Wharf"
              }
          ]
      },
      {
          "name": "Day 3: Chinatown and Lombard Street",
          "date": "2025-04-18",
          "description": "Discover San Francisco's vibrant Chinatown and the famous Lombard Street.",
          "stops": [
              {
                  "name": "Chinatown",
                  "startTime": "10am",
                  "endTime": "12pm",
                  "latitude": "37.7941",
                  "longitude": "-122.4078",
                  "description": "Wander through Chinatown and enjoy its unique shops and eateries.",
                  "pictureSearchTerms": "China Town San Francisco"
              },
              {
                  "name": "Lombard Street",
                  "startTime": "2pm",
                  "endTime": "4pm",
                  "latitude": "37.8021",
                  "longitude": "-122.4188",
                  "description": "Take photos of and walk down the famously crooked street.",
                  "pictureSearchTerms": "Lombard Street San Francisco"
              },
              {
                "name": "Check Into Hotel",
                "startTime": "9pm",
                "endTime": "-",
                "overnight": true,
                "latitude": "37.8021",
                "longitude": "-122.4188",
                "description": "Take photos of and walk down the famously crooked street.",
                "pictureSearchTerms": "Lombard Street San Francisco"
            }
          ]
      },
      {
          "name": "Day 4: Departure",
          "date": "2025-04-19",
          "description": "Wrap up the trip with a leisurely morning before departing San Francisco.",
          "stops": [
              {
                  "name": "Union Square",
                  "startTime": "9am",
                  "endTime": "11pm",
                  "latitude": "37.7879",
                  "longitude": "-122.4075",
                  "description": "Enjoy a relaxed morning with coffee and shopping in Union Square.",
                  "pictureSearchTerms": "Union Square San Francisco"
              }
          ]
      }
  ],
  "additional": [
      {
          "title": "Other things to see",
          "pictureSearchTerms": "Golden Gate Park",
          "points": [
              "Golden Gate Park",
              "San Francisco Zoo"
          ]
      },
      {
          "title": "What to watch out for",
          "pictureSearchTerms": "",
          "points": [
              "Crime rate around tourist areas",
              "Traffic"
          ]
      }
  ]
}


// 1. Should contain well known information (not empty)
test("No ID", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  delete badJSON.id;

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Missing required field: id"));
});

test("No description", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  delete badJSON.description;

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Missing required field: description"));
});

test("No days", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  delete badJSON.days;

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Missing required field: days"));
});

test("No latitude", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  delete badJSON.latitude;

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Missing required field: latitude"));
});

test("No longitude", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  delete badJSON.longitude;

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Missing required field: longitude"));
});

// 2. Text fields should be less than 300 chars and more than 5
test("Text over 300 chars", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.description = "A".repeat(3001);

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Text field over max char amount"));
});

test("Text fields at exactly 300 chars", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.description = "A".repeat(3000);

  await expect(validateTrip(badJSON)).resolves.toBe(true);
});

test("Text field under 5 chars", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.description = "A".repeat(4);

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Text field under max char amount"));
});

test("Text fields at exactly 5 chars", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.description = "A".repeat(5);

  await expect(validateTrip(badJSON)).resolves.toBe(true);
});

test("Textfield empty", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.description = "";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Missing required field: description"));
});

// 3. ID Should be valid
test("ID more than 150 chars", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.id = "A".repeat(151);

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("ID length is not valid"));
});

test("ID at exactly 150 chars", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.id = "A".repeat(150);

  await expect(validateTrip(badJSON)).resolves.toBe(true);
});

test("ID less than 5 chars", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.id = "A".repeat(4);

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("ID length is not valid"));
});

test("ID at exactly 5 chars", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.id = "A".repeat(5);

  await expect(validateTrip(badJSON)).resolves.toBe(true);
});

test("ID with whitespace", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.id = "going on a trip";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("ID cannot have whitespace"));
});

test("ID with hyphens", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.id = "going-on-a-trip";

  await expect(validateTrip(badJSON)).resolves.toBe(true);
});

// 4. Dates are valid
test("Date is not parseable", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.startDate = "16";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Invalid startDate or endDate"));
});

test("End Date after Start Date", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.startDate = "2025-05-2";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("endDate must be after startDate"));
});

test("Start date equals end date", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.endDate = badJSON.startDate;

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("endDate must be after startDate"));
});

test("Invalid number of days compared to Start/End", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.days = badJSON.days.slice(2);

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Trip must include the same amount of days as dates"));
});

test("Trip over a month", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.startDate = "2025-03-18";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Trip must be less than a month"));
});

// 5. Days should be valid
test("Days not a dictionary", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.days = "hi";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Trip must include the same amount of days as dates"));
});

test("Days empty array", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.days = [];

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Trip must include the same amount of days as dates"));
});

test("Day date outside of range", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.days[0].date = "2025-04-15";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Day date does not fit in range"));
});

test("Days are not sequential", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  let temp = badJSON.days[1].date;

  badJSON.days[1].date = badJSON.days[2].date;
  badJSON.days[2].date = temp;

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Days must be in sequential order"));
});

test("Day has no stops", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.days[0].stops = [];

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Day does not have any stops"));
});

// 6. Stops should be valid
test("Stop has invalid start time", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.days[0].stops[0].startTime = "hi";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Invalid time format"));
});

test("Stop has invalid stop time", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.days[0].stops[0].endTime = "2016-5";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Invalid time format"));
});

test("Stop has invalid start/stop time", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.days[0].stops[0].startTime = "2:00pm";
  badJSON.days[0].stops[0].endTime = "1:00pm";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Invalid stop start/end time"));
});

test("Overlapping stop times", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.days[0].stops[0].startTime = "2pm";
  badJSON.days[0].stops[0].endTime = "4pm";
  badJSON.days[0].stops.push({
    name: "Overlapping Stop",
    startTime: "3pm",
    endTime: "5pm",
    latitude: "37.8199",
    longitude: "-122.4783",
    description: "Overlapping stop times test case.",
  });

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Stop time conflicts with previous stop"));
});

test("Day has no lat/log", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  delete badJSON.days[0].stops[0].latitude;
  delete badJSON.days[0].stops[0].longitude;

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Stop is missing lat/long"));
});

test("Stop has invalid lat/long", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.days[0].stops[0].latitude = "invalid";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Invalid lat/long values"));
});

// 7. If present, additional should be validated
test("Additional has no points", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.additional[0].points = [];

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Additional parameters are not valid"));
});

// Full validation pass
test("Good JSON passes", async () => {
  expect(await validateTrip(goodJSON)).toBe(true);
});
