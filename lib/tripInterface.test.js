import { expect, test, describe } from "vitest";
import { createBackgroundImages, createTrip, handleFail } from "./tripInterface.js";
import { getFail } from "./mongo/trips";
import { newTrip } from "../schema/newTrip.js";

describe("Test Handling Fail", () => {
    const id = Date.now() 

    test("Create fail", async () => {
        const res = await handleFail(id)
        expect(res).toBe(true)

    })

    test("Check for fail", async () => {
        const res = await getFail(id)
        expect(res).toBeTruthy()

    })
})

describe("Test Creating Trip", () => {
    const body = newTrip.parse({
        id: String(Date.now()), 
        where: "Mongolia", 
        when: "Next week",
        description: "I want to do an epic food tour"
    })

    test("Create trip & first image", {timeout: 60000}, async () => {
        const res = await createTrip(body)
        expect(res).toBe(true)

    })

    test("Create background images", {timeout: 120000}, async () => {
        const res = await createBackgroundImages(body.id)
    })
})