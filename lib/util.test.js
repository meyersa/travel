import { expect, test, describe } from "vitest";
import { cleanAndVerify, generateImageId } from "./util";

test("Image ID generation", () => {
  let test1 = generateImageId("this is my image");
  let test2 = generateImageId("test");
  let test3 = generateImageId("hallo hallo hallo hallo");

  //   All 24 char
  expect(test1.length).toStrictEqual(24);
  expect(test2.length).toStrictEqual(24);
  expect(test3.length).toStrictEqual(24);

  //   Not equal to eachother
  expect(test1).not.toStrictEqual(test2);
  expect(test2).not.toStrictEqual(test3);
});

const MIN_LENGTH = 5 
const MAX_LENGTH = 300 

test("Clean and Verify", () => {
  // Remove whitespace
  expect(cleanAndVerify(" testing", MIN_LENGTH, MAX_LENGTH)).toEqual("testing");

  // Fails when input gets pruned to be too shoort
  expect(() => cleanAndVerify(" aaaa ", MIN_LENGTH, MAX_LENGTH)).toThrow("Input value is too short");

  // Passes correct length
  expect(cleanAndVerify("abcde", MIN_LENGTH, MAX_LENGTH)).toEqual("abcde");

  // Passes correct length
  const str150 = "a".repeat(150);
  expect(cleanAndVerify(str150, MIN_LENGTH, MAX_LENGTH)).toEqual(str150);

  // Fails too long
  const str301 = "a".repeat(301);
  expect(() => cleanAndVerify(str301, MIN_LENGTH, MAX_LENGTH)).toThrow("input value is too long");

  // Passes correct length
  const str300 = "a".repeat(300);
  expect(cleanAndVerify(str300, MIN_LENGTH, MAX_LENGTH)).toEqual(str300);

  // Create an input of total length 300 that trims down to below 5 characters.
  // Example: 295 spaces + "a" + 4 spaces => trimmed becomes "a" (length 1)
  const badInput = " ".repeat(295) + "a" + " ".repeat(4);
  expect(() => cleanAndVerify(badInput, MIN_LENGTH, MAX_LENGTH)).toThrow("Input value is too short");
});
