import { describe, it } from "node:test"
import { TokenReader } from "./TokenReader.js"
import { Word } from "./Word.js"
import { anyWord, symbol, wildcard, word } from "./TokenMatcher.js"
import { strictEqual, throws } from "node:assert"

/**
 * @typedef {import("./Token.js").Token} Token
 */
describe(`${TokenReader.name}([con bool false])`, () => {
    const init = () =>
        new TokenReader([new Word("con"), new Word("bool"), new Word("false")])
    it("matches [con bool false] using [word, word, wildcard]", () => {
        const r = init()

        let m

        if ((m = r.matches(word("con"), word("bool"), wildcard))) {
            strictEqual(m[1].value, "bool")
        } else {
            r.endMatch().errors.throw()
        }
    })

    it("fails when matching [con bool false] using [word, word, symbol]", () => {
        const r = init()

        let m
        if ((m = r.matches(word("con"), word("bool"), symbol(".")))) {
        } else {
            throws(() => r.endMatch().errors.throw())
        }
    })

    it("matches [con bool false] using [word, word] [word]", () => {
        const r = init()

        let m

        // this example also demonstrates how the temporary variable `m` can be reused
        if (
            (m = r.matches(word("con"), word("bool"))) &&
            (m = r.matches(anyWord))
        ) {
            strictEqual(m[0].value, "false")
        } else {
            r.endMatch().errors.throw()
        }
    })
})
