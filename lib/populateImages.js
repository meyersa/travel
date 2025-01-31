import axios from "axios";

export async function getImage(GOOGLE_CONSOLE_ID, GOOGLE_API_KEY, query) {
  /*
   * Get an image from Google using the programmatic search API
   *
   * Requires inputs for console_id, api_key, and the actual query
   *
   * From there it returns the CSE images (assuming search engine
   * is set to image search by default). It will also try multiple
   * until it gets one with an image.
   */
  if (!GOOGLE_CONSOLE_ID || !GOOGLE_API_KEY || !query) {
    throw new Error("Cannot have invalid parameters");
  }

  console.log(`Searching google images for ${query}`);

  // No idea if Axios handles this, but making the string query ready
  query = String(query).replace(" ", "%20");

  var res = await axios.get(
    `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CONSOLE_ID}&q=${query}&fileType=jpeg|png|webp&imgType=photo&imgSize=medium`
  );

  res = res.data["items"];

  console.log(`Found ${res.length} results. Finding images...`);

  for (let imgRaw of res) {
    let img;
    try {
      img = imgRaw["pagemap"]["cse_image"][0]["src"];
    } catch (e) {
      continue;
    }

    if (img) {
      console.log("Found image. Returning");

      let source = imgRaw["displayLink"];
      let title = imgRaw["title"];

      return { pictureUrl: img, source: source, title: title };
    }
  }

  console.error("Unable to find search results");
}

export async function populateImages(GOOGLE_CONSOLE_ID, GOOGLE_API_KEY, tripJSON) {
  /*
   * Populates images for a given tripJSON using google image search
   * and provided AI context for images
   */
  if (!tripJSON) {
    throw new Error("Cannot have invalid tripJSON");
  }

  console.log(`Populating images for ${tripJSON.name}`);

  tripJSON["picture"] = await getImage(GOOGLE_CONSOLE_ID, GOOGLE_API_KEY, tripJSON["pictureSearchTerms"]);

  for (let day of tripJSON["days"]) {
    for (let stop of day.stops) {
      setTimeout(1000)

      try {
        if (!stop["pictureSearchTerms"]) {
          continue;
        }
        stop["picture"] = await getImage(GOOGLE_CONSOLE_ID, GOOGLE_API_KEY, stop["pictureSearchTerms"]);
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
    try {
      if (!add["pictureSearchTerms"]) {
        continue;
      }
      add["picture"] = await getImage(GOOGLE_CONSOLE_ID, GOOGLE_API_KEY, add["pictureSearchTerms"]);
    } catch (e) {
      continue;
    }
  }

  console.log("Finished filling images. Returning");
  return tripJSON;
}
