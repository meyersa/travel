import { expect, test } from "vitest";
import { validateTrip } from "./validateTrip.js";

const goodJSON = {
  id: "fssdddfff",
  name: "San Francisco Getaway",
  startDate: "2025-04-16",
  endDate: "2025-04-19",
  description:
    "A short but eventful trip exploring the iconic sights and culture of San Francisco.",
  pictureUrl:
    "https://cdn.britannica.com/13/77413-050-95217C0B/Golden-Gate-Bridge-San-Francisco.jpg",
  days: [
    {
      name: "Day 1: Arrival and Golden Gate",
      date: "2025-04-16",
      description: "Arrive in San Francisco and visit the world-famous Golden Gate Bridge.",
      pictureUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYWxU23Zn1ZvuXze1EU5MTp23EAvonnn-ckw&s",
      stops: [
        {
          name: "Golden Gate Bridge",
          startTime: "2pm",
          endTime: "5pm",
          lattitude: "37.8199",
          longitude: "-122.4783",
          description: "Walk across the Golden Gate Bridge and enjoy stunning views of the bay.",
          pictureUrl:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzsa39Ct_wlG-0JAPqMIuZOyiJisvdO_Df_Q&s",
        },
      ],
    },
    {
      name: "Day 2: Alcatraz and Fisherman's Wharf",
      date: "2025-04-17",
      description:
        "Explore Alcatraz Island in the morning and enjoy the bustling Fisherman's Wharf in the afternoon.",
      pictureUrl: "https://upload.wikimedia.org/wikipedia/commons/1/17/Alcatraz_2021.jpg",
      stops: [
        {
          name: "Alcatraz Island",
          startTime: "9am",
          endTime: "12pm",
          lattitude: "37.8267",
          longitude: "-122.4233",
          description: "Take a ferry to Alcatraz and tour the historic prison.",
        },
        {
          name: "Fisherman's Wharf",
          startTime: "2pm",
          endTime: "5pm",
          lattitude: "37.8080",
          longitude: "-122.4177",
          description:
            "Enjoy fresh seafood, shopping, and street performances at Fisherman's Wharf.",
          pictureUrl: "https://www.dylanstours.com/wp-content/uploads/2020/02/unnamed-2.png",
        },
      ],
    },
    {
      name: "Day 3: Chinatown and Lombard Street",
      date: "2025-04-18",
      description: "Discover San Francisco's vibrant Chinatown and the famous Lombard Street.",
      pictureUrl:
        "https://media.architecturaldigest.com/photos/645aa6628a3297209fc40112/16:9/w_2560%2Cc_limit/GettyImages-1353387182.jpg",
      stops: [
        {
          name: "Chinatown",
          startTime: "10am",
          endTime: "12pm",
          lattitude: "37.7941",
          longitude: "-122.4078",
          description: "Wander through Chinatown and enjoy its unique shops and eateries.",
          pictureUrl:
            "https://media.cntraveler.com/photos/5fffccfcd273ea22962091eb/16:9/w_2560,c_limit/1225606936",
        },
        {
          name: "Lombard Street",
          startTime: "2pm",
          endTime: "4pm",
          lattitude: "37.8021",
          longitude: "-122.4188",
          description: "Take photos of and walk down the famously crooked street.",
          pictureUrl:
            "https://www.sftravel.com/sites/default/files/styles/hero/public/2022-10/lombard-street-aerial.jpg.webp?itok=BqBM3IRW",
        },
      ],
    },
    {
      name: "Day 4: Departure",
      date: "2025-04-19",
      description: "Wrap up the trip with a leisurely morning before departing San Francisco.",
      pictureUrl:
        "https://s.yimg.com/ny/api/res/1.2/zbPGkNS0oy7hFIyWr0hMnw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyMDA7aD04MDA-/https://s.yimg.com/os/creatr-uploaded-images/2023-01/afdc8520-97ab-11ed-b5f6-bb643b3d0b9c",
      stops: [
        {
          name: "Union Square",
          startTime: "9am",
          endTime: "11pm",
          lattitude: "37.7879",
          longitude: "-122.4075",
          description: "Enjoy a relaxed morning with coffee and shopping in Union Square.",
          pictureUrl:
            "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/San_Francisco_Union_Square.jpg/1200px-San_Francisco_Union_Square.jpg",
        },
      ],
    },
  ],
  additional: [
    {
      title: "Other things to see",
      pictureUrl: "",
      points: ["Golden Gate Park", "San Francisco Zoo"],
    },
    {
      title: "What to watch out for",
      pictureUrl: "",
      points: ["Crime rate around tourist areas", "Traffic"],
    },
  ],
};

test("No ID", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  delete badJSON.id;

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Missing required field: id"));
});

test("ID too short", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.id = "test";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("ID length is not valid"));
});

test("ID with whitespace", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.id = "going on a trip";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("ID cannot have whitespace"));
});

test("Invalid Start/End Date", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.startDate = "16";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Invalid startDate or endDate"));
});

test("End Date after Start Date", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.startDate = "2025-05-2";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("endDate must be after startDate"));
});

test("Trip too long", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.startDate = "2025-03-18";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Trip must be less than a month"));
});

test("Invalid number of days compared to Start/End", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.days = badJSON.days.slice(2);

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Trip must include the same amount of days as dates"));
});

test("Too long of description", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.description = "Commodo irure irure velit magna laborum excepteur. Aliquip esse enim eu amet occaecat mollit eiusmod occaecat voluptate tempor est Lorem. Minim sint sit sit id duis incididunt enim nostrud proident id ad quis et. Adipisicing ex pariatur magna nisi ad ut nulla elit officia. Non cillum duis ea nulla nostrud dolore nostrud.";

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Text field over max char amount"));
});

test("Day has no stops", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.days[0].stops = [];

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Day does not have any stops"));
});

test("Day has no lat/log", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  delete badJSON.days[0].stops[0].lattitude;
  delete badJSON.days[0].stops[0].longitude;

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Missing required field"));
});

test("Additional has no points", async () => {
  let badJSON = JSON.parse(JSON.stringify(goodJSON));
  badJSON.additional[0].points = []

  await expect(validateTrip(badJSON)).rejects.toThrowError(Error("Additional parameters are not valid"));
});

test("Good JSON passes", async () => {
  expect(await validateTrip(goodJSON)).toBe(true);
});
