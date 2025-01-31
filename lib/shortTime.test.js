import { expect, test } from "vitest";
import { parseShortTime, compareShortTime } from "./shortTime.js";

test("Normal time (1:00 AM)", () => {
  expect(parseShortTime("01:00 AM")).toStrictEqual({ hour: 1, minute: 0, half: 1 });
});

test("Normal time, no space (1:00 AM)", () => {
  expect(parseShortTime("01:00AM")).toStrictEqual({ hour: 1, minute: 0, half: 1 });
});

test("Normal time, no space (12:32 AM)", () => {
  expect(parseShortTime("12:32AM")).toStrictEqual({ hour: 0, minute: 32, half: 1 });
});

test("Normal time, no space (12:32 PM)", () => {
  expect(parseShortTime("12:32PM")).toStrictEqual({ hour: 0, minute: 32, half: 2 });
});

test("Normal time, no space (1:00 AM)", () => {
  expect(parseShortTime("01AM")).toStrictEqual({ hour: 1, minute: 0, half: 1 });
});

test("Normal time, no space (12:00 AM)", () => {
  expect(parseShortTime("12am")).toStrictEqual({ hour: 0, minute: 0, half: 1 });
});

test("Normal time, no space (12:00 PM)", () => {
  expect(parseShortTime("12pm")).toStrictEqual({ hour: 0, minute: 0, half: 2 });
});

test("Normal time, no space (11:00 PM)", () => {
  expect(parseShortTime("11pm")).toStrictEqual({ hour: 11, minute: 0, half: 2 });
});

test("Normal time, no space (9:00 AM)", () => {
  expect(parseShortTime("9am")).toStrictEqual({ hour: 9, minute: 0, half: 1 });
});

test("Normal time, without AM (1:00 AM)", () => {
  expect(parseShortTime("01:00")).toStrictEqual({ hour: 1, minute: 0, half: 1 });
});

test("Normal time, without AM (1:00 AM)", () => {
  expect(parseShortTime("0100")).toStrictEqual({ hour: 1, minute: 0, half: 1 });
});

test("Normal time, without AM (1:00 AM)", () => {
  expect(parseShortTime("01")).toStrictEqual({ hour: 1, minute: 0, half: 1 });
});

test("Invalid time (Noon)", () => {
  expect(() => parseShortTime("Noon")).toThrowError(Error("Invalid time format, more than 4 matches noon"));
});

test("Invalid time (13:00 AM)", () => {
  expect(() => parseShortTime("13:00 AM")).toThrowError(Error("Invalid time format, hours not 0-12"));
});

test("Invalid time (69)", () => {
  expect(() => parseShortTime("69")).toThrowError(Error("Invalid time format, more than 4 matches 69"));
});

// For the comparison now
test("12:00 AM vs 1:00 PM", () => {
  expect(compareShortTime({ hour: 0, minute: 0, half: 1 }, { hour: 1, minute: 0, half: 2 })).toBe(-1);
});

test("5:00 AM vs 6:00 PM", () => {
  expect(compareShortTime({ hour: 5, minute: 0, half: 1 }, { hour: 6, minute: 0, half: 2 })).toBe(-1);
});

test("6:00 PM vs 2:00 AM", () => {
  expect(compareShortTime({ hour: 6, minute: 0, half: 2 }, { hour: 2, minute: 0, half: 1 })).toBe(1);
});

test("6:00 PM vs 2:00 PM", () => {
  expect(compareShortTime({ hour: 6, minute: 0, half: 2 }, { hour: 2, minute: 0, half: 2 })).toBe(1);
});

test("6:05 PM vs 6:01 PM", () => {
    expect(compareShortTime({ hour: 6, minute: 5, half: 2 }, { hour: 6, minute: 1, half: 2 })).toBe(1);
  });

  test("6:05 PM vs 6:05 PM", () => {
    expect(compareShortTime({ hour: 6, minute: 5, half: 2 }, { hour: 6, minute: 5, half: 2 })).toBe(0);
  });