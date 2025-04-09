import { expect, test } from "vitest";
import { newTrip } from "./newTrip";
import { ZodError } from "zod";

const EXAMPLE_TRIP = {
    "id": String(Date.now()),
    "description": "Tomorrow, idk where, but I haven't thought about this yet"

}

test("See if parsing works", () => {
    expect(newTrip.parse(EXAMPLE_TRIP)).toBeTruthy()

})

test("See if bad parsing does not work", () => {
    var new_example = EXAMPLE_TRIP
    new_example.description = "t" 

    expect(() => newTrip.parse(new_example)).throws(ZodError)

})

test("Additional values shouldn't work", () => {
    var new_example = EXAMPLE_TRIP
    new_example.plans = "testing this out"

    expect(() => newTrip.parse(new_example)).throws(ZodError)

})