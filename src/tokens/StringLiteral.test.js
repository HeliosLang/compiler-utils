import { strictEqual } from "node:assert"
import { describe, it } from "node:test"
import { expectDefined } from "@helios-lang/type-utils"
import { makeStringLiteral } from "./StringLiteral.js"

/**
 * @import { StringLiteral } from "../index.js"
 */

describe("StringLiteral", () => {
    it("can access value after adding to Map", () => {
        /**
         * @type {Map<string, StringLiteral>}
         */
        const m = new Map()

        const s = makeStringLiteral({ value: "hello" })

        m.set(s.value, s)

        strictEqual(expectDefined(m.get(s.value)).value, s.value)
    })
})
