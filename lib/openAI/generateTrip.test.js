import { expect, test, describe } from "vitest";
import { verifyDefaults, buildSystemMessage, buildUserMessage, generateTrip } from "./generateTrip.js";

describe("Check Trip Generation", async () => {
  test("Check defaults", () => {
    expect(verifyDefaults()).toBe(true);
  });

  test("Check system output, no fail message", () => {
    expect(buildSystemMessage().role).toEqual("system");
    expect(buildSystemMessage().content.length).greaterThan(100);
  });

  test("Check system output, fail message", () => {
    expect(buildSystemMessage("Invalid short time").content).includes(
      "The previous result failed validation for: Invalid short time"
    );
  });

  test("Check user output", () => {
    const body = {
      id: String(Date.now()),
      where: "testtt",
      when: "testtt",
      description: "testttt",
    };

    expect(buildUserMessage(body).role).toEqual("user");
    expect(buildUserMessage(body).content.length).greaterThan(30);
  });

  // Costs money !
  test("Query ChatGPT", { timeout: 30000 }, async () => {
    const body = {
      id: String(Date.now()),
      where: "Las Vegas - National Park tour",
      when: "Sometime this summer for 7 days",
      description:
        "I'd like to do the national park tour from Vegas. This should include the grand canyon, valley of fire, and zion. I'd also like to start and end in Vegas.",
    };

    const response = await generateTrip(body);
    expect(response).toBe(true);
  });
});
