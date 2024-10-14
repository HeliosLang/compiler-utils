import { strictEqual } from "node:assert"
import { describe, it } from "node:test"
import { expectSome } from "@helios-lang/type-utils"
import { makeStringLiteral } from "./StringLiteral.js"

/**
 * @typedef {import("./Token.js").StringLiteral} StringLiteral
 */

describe("StringLiteral", () => {
    it("can access value after adding to Map", () => {
        /**
         * @type {Map<string, StringLiteral>}
         */
        const m = new Map()

        const s = makeStringLiteral({ value: "hello" })

        m.set(s.value, s)

        strictEqual(expectSome(m.get(s.value)).value, s.value)
    })
})
