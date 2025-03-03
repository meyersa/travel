import { describe, expect, test } from "vitest";
import { tripSchema } from "./tripSchema.js";
import example from "../example.json" assert { type: "json" };
import { ZodError } from "zod";

const valid_times = [
  "01:00 AM",
  "01:00AM",
  "12:32AM",
  "12:32PM",
  "01AM",
  "12am",
  "12pm",
  "9am",
  "9:00am",
  "9pm",
  "9:00pm",
];

const invalid_times = ["Noon", "13:00am", "69", "120955"];

describe("Test Trip JSON Schema", () => {
  test("Ensure known good works", () => {
    expect(tripSchema.parse(example)).toBeTruthy();
  });

  test("Ensure valid short times work", () => {
    for (let valid_time of valid_times) { 
        let test_example = JSON.parse(JSON.stringify(example));
        test_example.days[0].stops[0].startTime = valid_time;
  
        console.log(`Testing ${valid_time}`)
        expect(tripSchema.parse(test_example)).toBeTruthy();
    }
  })

  test("Ensure invalid short don't times work", () => {
    for (let invalid_time of invalid_times) { 
        let test_example = JSON.parse(JSON.stringify(example));
        test_example.days[0].stops[0].startTime = invalid_time;
  
        console.log(`Testing ${invalid_time}`)
        expect(() => tripSchema.parse(test_example)).throws(ZodError);
    }
  })
});
