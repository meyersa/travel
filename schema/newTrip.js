import { z } from "zod";

const textSchema = z.string().min(5).max(300);

export const newTrip = z.object({
    id: textSchema,
    description: textSchema
});