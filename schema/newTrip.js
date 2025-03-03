import { z } from "zod";

const textSchema = z.string().min(5).max(300);

const newTrip = z.object({
    id: textSchema,
    where: textSchema,
    when: textSchema,
    description: textSchema
});

export { newTrip }