import { expect, test } from "vitest";
import { initMongo } from "./mongo.js";
import { Db } from "mongodb";
import { configDotenv } from "dotenv";
configDotenv();

const { MONGO_DB, MONGO_URL } = process.env;

test("Create MongoDB", async () => {
  const db = await initMongo(MONGO_URL, MONGO_DB);
  expect(db).instanceOf(Db);

});