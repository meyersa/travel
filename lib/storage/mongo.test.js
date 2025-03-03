import { afterAll, beforeAll,expect, test } from "vitest";
import { initMongo } from "./mongo.js";
import { Db } from "mongodb";
import { configDotenv } from "dotenv";

configDotenv();
const { MONGO_DB, MONGO_URL } = process.env;

// Init DB connection
let db;
beforeAll(async () => {
  db = await initMongo(MONGO_URL, MONGO_DB);

});

// Close DB connection
afterAll(async () => {
  db.client.close;
});

test("Create MongoDB", async () => {
  expect(db).instanceOf(Db);

});