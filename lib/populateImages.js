import OpenAI from "openai";

/*
 * Create OpenAI object and validate Token
 */
export function initOpenAI(OPENAI_KEY) {
  if (!OPENAI_KEY || OPENAI_KEY.length < 10) {
    throw new Error("Missing OpenAI Key");
  }
  return new OpenAI({ apiKey: OPENAI_KEY });
}

export async function getImage(client, query) {
  /*
   * Get an image from DALLE 3
   *
   * Requires inputs for query
   */
  console.log(`Generating image for ${query}`);

  // Emphasize web styling
  query += "\nMake image vivid, in the style of a travel website. They should be of general landscape views of something. For example, Macchu Picchu would be like a drone shot, whereas the Chicago Bean would be a smartphone camera picture."

  const response = await client.images.generate({
    model: "dall-e-3",
    prompt: query,
    n: 1,
    size: "1792x1024",
  })

  console.log(response); 

  if (!response) {
    console.error("Unable to find search results");
    return null

  }

  return response.data[0].url
}

export async function populateImages(OPENAI_KEY, tripJSON) {
  /*
   * Populates images for a given tripJSON using google image search
   * and provided AI context for images
   */
  if (!tripJSON) {
    throw new Error("Cannot have invalid tripJSON");
  }
  const client = initOpenAI(OPENAI_KEY)

  console.log(`Populating images for ${tripJSON.name}`);

  // Emphasize title image
  tripJSON["picture"] = await getImage(
    client,
    "This is the title image, make it more broad\n" + tripJSON["pictureSearchTerms"]
  );

  for (let day of tripJSON["days"]) {
    for (let stop of day.stops) {
      await new Promise((r) => setTimeout(r, 1000));

      try {
        if (!stop["pictureSearchTerms"]) {
          continue;
        }
        stop["picture"] = await getImage(
          client,
          stop["pictureSearchTerms"]
        );
      } catch (e) {
        continue;
      }
    }
  }

  if (!tripJSON["additional"]) {
    console.log("No additional content found. Returning");
    return tripJSON;
  }

  console.log("Filling images for additional");

  for (let add of tripJSON["additional"]) {
    await new Promise((r) => setTimeout(r, 1000));

    try {
      if (!add["pictureSearchTerms"]) {
        continue;
      }
      add["picture"] = await getImage(client, add["pictureSearchTerms"]);
    } catch (e) {
      continue;
    }
  }

  console.log("Finished filling images. Returning");
  return tripJSON;
}