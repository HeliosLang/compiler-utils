import { describe, it } from "node:test"
import { makeHeliosSource, makeSource } from "./Source.js"
import { throws } from "node:assert"

describe("makeSource", () => {
    it("works for non-helios-specific script", () => {
        makeSource('(con string "")')
    })
})

describe("makeHeliosSource", () => {
    it("throws an error non-helios-specific script", () => {
        throws(() => {
            makeHeliosSource('(con string "")')
        })
    })
})
