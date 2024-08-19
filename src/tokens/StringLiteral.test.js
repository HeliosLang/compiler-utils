import { strictEqual } from "node:assert"
import { describe, it } from "node:test"
import { expectSome } from "@helios-lang/type-utils"
import { StringLiteral } from "./StringLiteral.js"

describe(StringLiteral.name, () => {
    it("can access value after adding to Map", () => {
        /**
         * @type {Map<string, StringLiteral>}
         */
        const m = new Map()

        const s = new StringLiteral("hello")

        m.set(s.value, s)

        strictEqual(expectSome(m.get(s.value)).value, s.value)
    })
})
