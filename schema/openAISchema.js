/**
 * A more basic version of tripSchema.js
 * Since OpenAI doesn't support full Zod output, 
 * this will act as the validator
 */

import { z } from "zod";

const stopSchema = z.object({
  name: z.string(),
  startTime: z.string(), // Example: "9am"
  endTime: z.string(), // Example: "10am"
  ignorenight: z.boolean(),
  latitude: z.string(), // Example: "43.5917"
  longitude: z.string(), // Example: "-84.7740"
  description: z.string(),
  pictureSearchTerms: z.string().optional(),
});

const daySchema = z.object({
  name: z.string(),
  date: z.string(), // Format: yyyy-mm-dd
  description: z.string(),
  stops: z.array(stopSchema), // List of stops for the day
});

const additionalInfoSchema = z.object({
  title: z.string(),
  pictureSearchTerms: z.string().optional(),
  points: z.array(z.string()),
});

const openAISchema = z.object({
  name: z.string(),
  startDate: z.string(), // Format: yyyy-mm-dd
  endDate: z.string(), // Format: yyyy-mm-dd
  latitude: z.string(), // Example: "37.7749"
  longitude: z.string(), // Example: "-122.4194"
  description: z.string(),
  pictureSearchTerms: z.string(),
  days: z.array(daySchema), // List of days in the trip
  additional: z.array(additionalInfoSchema).optional(), // Optional additional info
});

export { openAISchema };