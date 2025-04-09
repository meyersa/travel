import example from "../../example.json" assert { type: "json" };
import { describe, expect, test } from "vitest";
import { addTrip, checkForDups, deleteTrip, getFail, getTripById, getTrips, populateFail, updateTrip } from "./trips";

const NEW_NAME = "This is the testing name";

describe("Test get all trips", async () => {
  test("Test get all trips", async () => {
    const res = await getTrips()
    expect(res.length).toBeGreaterThan(1) 

  })
})

describe("Test Mongo Trips Interface", async () => {
  test("Add Example Trip from JSON", async () => {
    const res = await addTrip(example);
    expect(res).toBe(true);
  });

  test("Check to Ensure Example is now Duplicate", async () => {
    const res = await checkForDups(example.id);
    expect(res).toBe(true);
  });

  test("Check Add Respects Duplicate", async () => {
    const res = await addTrip(example);
    expect(res).toBe(false);
  });

  test("Update Example Trip Name", async () => {
    var newExample = example;
    newExample.name = NEW_NAME;

    const res = await updateTrip(newExample);
    expect(res).toBe(true);
  });

  test("Check getTrip to Validate New Name", async () => {
    const res = await getTripById(example.id);
    expect(res.name).toEqual(NEW_NAME);
  });

  test("Delete example trip", async () => {
    const res = await deleteTrip(example.id);
    expect(res).toEqual(true);
  });
});

describe("Test Mongo Fails interface", () => {
  const id = Date.now() 

  test("Upload a failure", async () => {
    const res = await populateFail(id)
    expect(res).toBe(true) 

  })

  test("Retrieve failure", async () => { 
    const res = await getFail(id)
    expect(res).toBeTruthy(true) 

  })
})