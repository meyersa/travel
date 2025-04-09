import { z } from "zod";
import { newTrip } from "./newTrip.js";

// Helper schemas
const idSchema = z.string().min(5).max(150).regex(/^\S+$/, "ID cannot contain spaces");
const textSchema = z.string().min(5).max(300);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (yyyy-mm-dd)");
const latLongSchema = z.string().regex(/^-?\d+(\.\d+)?$/, "Invalid latitude/longitude");
const timeSchema = z.string().regex(/^(-|0?[1-9]|1[0-2])(:[0-5][0-9])?\s?(am|pm)?$/i, "Invalid time format (e.g., '9am' or '-')");
const pictureSchema = z.string().min(5).max(150).optional()

// Stop Schema
const stopSchema = z.object({
  name: textSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  ignorenight: z.boolean().default(false), 
  latitude: latLongSchema,
  longitude: latLongSchema,
  description: textSchema,
  pictureSearchTerms: z.string().optional(),
  picture: pictureSchema,
});

// Day Schema
const daySchema = z.object({
  name: textSchema,
  date: dateSchema,
  description: textSchema,
  stops: z.array(stopSchema).min(1),
});

// Additional Info Schema
const additionalInfoSchema = z.object({
  title: textSchema,
  pictureSearchTerms: z.string().optional(),
  picture: pictureSchema,
  points: z.array(textSchema).min(1),
});

// Main Trip Schema
export const tripSchema = z.object({
  id: idSchema,
  name: textSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  latitude: latLongSchema,
  longitude: latLongSchema,
  description: textSchema,
  pictureSearchTerms: textSchema,
  picture: pictureSchema,
  days: z.array(daySchema).min(1),
  additional: z.array(additionalInfoSchema).optional(),
  newTrip: newTrip.optional()
});