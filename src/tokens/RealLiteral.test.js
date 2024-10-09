import { strictEqual } from "node:assert"
import { describe, it } from "node:test"
import { RealLiteral } from "./RealLiteral.js"

describe(RealLiteral.name, () => {
    it("formats 1.0 as 1.0", () => {
        strictEqual(RealLiteral.fromNumber(1.0).toString(), "1.0")
    })

    it("formats -1.0 as -1.0", () => {
        strictEqual(RealLiteral.fromNumber(-1.0).toString(), "-1.0")
    })

    it("formats -1.000001 as -1.000001", () => {
        strictEqual(RealLiteral.fromNumber(-1.000001).toString(), "-1.000001")
    })

    it("formats 0.999999 as 0.999999", () => {
        strictEqual(RealLiteral.fromNumber(0.999999).toString(), "0.999999")
    })

    it("formats 0.9999999 as 1.0", () => {
        strictEqual(RealLiteral.fromNumber(0.9999999).toString(), "1.0")
    })

    it("formats 0.001 as 0.001", () => {
        strictEqual(RealLiteral.fromNumber(0.001).toString(), "0.001")
    })

    it("formats -0.001 as -0.001", () => {
        strictEqual(RealLiteral.fromNumber(-0.001).toString(), "-0.001")
    })

    it("formats 100 as 100.0", () => {
        strictEqual(RealLiteral.fromNumber(100).toString(), "100.0")
    })
})
