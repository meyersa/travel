import { afterAll, beforeAll,expect, test } from "vitest";
import { initMongo } from "./mongo.js";
import { Db } from "mongodb";

test("Create MongoDB", async () => {
  const db = await initMongo()
  expect(db).instanceOf(Db);

});