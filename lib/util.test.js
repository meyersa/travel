import { expect, test, describe } from "vitest";
import { cleanAndVerify, generateImageId, parseShortTime, compareShortTime } from "./util";

describe("Test Image ID generation", () => {
  let test1 = generateImageId("this is my image");
  let test2 = generateImageId("test");
  let test3 = generateImageId("hallo hallo hallo hallo");

  test("Should equal 24 char", () => {
    expect(test1.length).toStrictEqual(24);
    expect(test2.length).toStrictEqual(24);
    expect(test3.length).toStrictEqual(24);
  
  })

  test("Should be unique", () => {
    expect(test1).not.toStrictEqual(test2);
    expect(test2).not.toStrictEqual(test3);
  })
})

describe("Test Clean and Verify", () => {
  const MIN_LENGTH = 5 
  const MAX_LENGTH = 300 

  test("Remove whitespace", () => { 
    expect(cleanAndVerify(" testing", MIN_LENGTH, MAX_LENGTH)).toEqual("testing");

  })

  test("Fails when input gets pruned too short", () => {
    expect(() => cleanAndVerify(" aaaa ", MIN_LENGTH, MAX_LENGTH)).toThrow("Input value is too short");

  })

  test("Passes correct length", () => {
    expect(cleanAndVerify("abcde", MIN_LENGTH, MAX_LENGTH)).toEqual("abcde");

  })

  test("Passes mid length", () => {
    const str150 = "a".repeat(150);
    expect(cleanAndVerify(str150, MIN_LENGTH, MAX_LENGTH)).toEqual(str150);
  
  })

  test("Fails too long", () => {
    const str301 = "a".repeat(301);
    expect(() => cleanAndVerify(str301, MIN_LENGTH, MAX_LENGTH)).toThrow("input value is too long");
  
  })

  test("Passes just enough length", () => {
    const str300 = "a".repeat(300);
    expect(cleanAndVerify(str300, MIN_LENGTH, MAX_LENGTH)).toEqual(str300);
  
  })

  test("Fails just below after trimming", () => {
    const badInput = " ".repeat(295) + "a" + " ".repeat(4);
    expect(() => cleanAndVerify(badInput, MIN_LENGTH, MAX_LENGTH)).toThrow("Input value is too short");
  
  })
})

describe("Test Parsing Short Values", () => {
  const short_values = {
    // Valid cases
    "01:00 AM": { hour: 1, minute: 0, half: "am" },
    "01:00AM": { hour: 1, minute: 0, half: "am" },
    "12:32AM": { hour: 12, minute: 32, half: "am" },
    "12:32PM": { hour: 12, minute: 32, half: "pm" },
    "01AM": { hour: 1, minute: 0, half: "am" },
    "12am": { hour: 12, minute: 0, half: "am" },
    "12pm": { hour: 12, minute: 0, half: "pm" },
    "11pm": { hour: 11, minute: 0, half: "pm" },
    "9am": { hour: 9, minute: 0, half: "am" },

    // Error cases
    "Noon": new Error("Invalid time format, more than 4 matches noon"),
    "13:00 AM": new Error("Invalid time format: 13:00 am"),
    "69": new Error("Invalid time format: 69"),
  };

  test("Should correctly parse valid times and throw errors on invalid ones", () => {
    for (let [input, expectedOutput] of Object.entries(short_values)) {
      console.log(`Testing: ${input}`);

      if (expectedOutput instanceof Error) {
        expect(() => parseShortTime(input)).toThrow(expectedOutput.message);
      } else {
        expect(parseShortTime(input)).toEqual(expectedOutput);
      }
    }
  });
});


describe("Test Comparing Short Values", () => {
  const compare_values = [
    ["1am", "2am", -1],
    ["1pm", "2am", 1],
    ["1am", "6am", -1],
    ["12am", "1pm", -1],
    ["9pm", "2am", 1],
    ["12pm", "1pm", -1],
    ["12pm", "11am", 1],
    ["4pm", "4am", 1],
    ["4am", "4pm", -1],
    ["12pm", "12pm", 0],
  ];

  test("Should equal set output", () => {
    for (let [one, two, result] of compare_values) {
      console.log(`Comparing ${one} / ${two}, Expected: ${result}`);
      expect(compareShortTime(one, two)).toEqual(result);
    }
  });
});



