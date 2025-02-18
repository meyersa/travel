import OpenAI from "openai";

const imageMax = 10;

/*
 * Create OpenAI object and validate Token
 */
export function initOpenAI(OPENAI_KEY) {
  if (!OPENAI_KEY || OPENAI_KEY.length < 10) {
    throw new Error("Missing OpenAI Key");
  }
  return new OpenAI({ apiKey: OPENAI_KEY });
}

export async function getImage(client, query, importance = 3) {
  /*
   * Get an image from DALLE 3
   *
   * Requires inputs for query
   */
  console.log(`Generating image for ${query}`);

  // Emphasize web styling
  query +=
    "\nMake image vivid, in the style of a travel website. They should be of general landscape views of something. For example, Machu Picchu would be like a drone shot, whereas the Chicago Bean would be a smartphone camera picture.";

  var response;
  if (importance == 1) {
    response = await client.images.generate({
      model: "dall-e-3",
      prompt: query,
      n: 1,
      size: "1792x1024",
      quality: "hd",
    });
  // } else if (importance < imageMax + 1) {
  //   response = await client.images.generate({
  //     model: "dall-e-3",
  //     prompt: query,
  //     n: 1,
  //     size: "1024x1024",
  //   });
  } else {
    response = await client.images.generate({
      model: "dall-e-2",
      prompt: query,
      n: 1,
      size: "1024x1024",
    });
  }

  if (!response) {
    console.error("Unable to find search results");
    return null;
  }

  console.log(`Generated image for ${query}`);
  return response.data[0].url;
}

export async function populateImages(OPENAI_KEY, tripJSON) {
  /*
   * Populates images for a given tripJSON using google image search
   * and provided AI context for images
   */
  if (!tripJSON) {
    throw new Error("Cannot have invalid tripJSON");
  }
  const client = initOpenAI(OPENAI_KEY);

  console.log(`Populating images for ${tripJSON.name}`);

  // Collect image requests (limit to first 10)
  var imageCount = 0;

  // Wrap calling with helpers
  async function manageReq(query) {
    return await getImage(client, query, imageCount);
  }

  // Title image
  tripJSON["picture"] = await manageReq(
    "This is the title image, make it more broad\n" + tripJSON["pictureSearchTerms"]
  );

  // Iterate through days
  for (let day of tripJSON["days"]) {
    for (let stop of day.stops) {
      try {
        if (!stop["pictureSearchTerms"]) {
          continue;
        }

        stop["picture"] = await manageReq(stop["pictureSearchTerms"]);
      } catch (e) {
        continue;
      }
    }
  }

  // Additional pictures
  if (!tripJSON["additional"]) {
    console.log("No additional content found. Returning");
    return tripJSON;
  }

  console.log("Filling images for additional");

  for (let add of tripJSON["additional"]) {
    try {
      if (!add["pictureSearchTerms"]) {
        continue;
      }
      add["picture"] = await manageReq(add["pictureSearchTerms"]);
    } catch (e) {
      continue;
    }
  }

  console.log("Finished filling images. Returning");
  return tripJSON;
}
