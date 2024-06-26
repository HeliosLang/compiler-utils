import { describe, it } from "node:test"
import { TokenReader } from "./TokenReader.js"
import { Word } from "./Word.js"
import { anyWord, group, symbol, wildcard, word } from "./TokenMatcher.js"
import { strictEqual, throws } from "node:assert"
import { Group } from "./Group.js"

/**
 * @typedef {import("./Token.js").Token} Token
 */
describe(`${TokenReader.name}([con bool false])`, () => {
    const testTokens = [new Word("con"), new Word("bool"), new Word("false")]

    it("matches [con bool false] using [word, word, wildcard]", () => {
        const r = new TokenReader(testTokens)

        let m

        if ((m = r.matches(word("con"), word("bool"), wildcard))) {
            strictEqual(m[1].value, "bool")
        } else {
            r.endMatch().errors.throw()
        }
    })

    it("fails when matching [con bool false] using [word, word, symbol]", () => {
        const r = new TokenReader(testTokens)

        let m
        if ((m = r.matches(word("con"), word("bool"), symbol(".")))) {
            m
        } else {
            throws(() => {
                r.endMatch()
                console.log(r.errors.errors.length)
                r.errors.throw()
            })
        }
    })
    ;("(program 0.0.0 (con bytes #))")
    it("matches [con bool false] using [word, word] [word]", () => {
        const r = new TokenReader(testTokens)

        let m

        // this example also demonstrates how the temporary variable `m` can be reused
        if (
            (m = r.matches(word("con"), word("bool"))) &&
            (m = r.matches(anyWord))
        ) {
            strictEqual(m.value, "false")
        } else {
            r.endMatch().errors.throw()
        }
    })

    it("matches [(con bool false)] using [group] [word, word, word]", () => {
        let r = new TokenReader([new Group("(", [testTokens], [])])
        let m

        if ((m = r.matches(group("(")))) {
            r = m.fields[0]

            if (
                r.matches(word("con"), word("bool")) &&
                (m = r.matches(anyWord))
            ) {
                strictEqual(m.value, "false")
            }
        }

        r.endMatch()
        r.errors.throw()
    })

    it("finds bool in [con bool false] and returns correct readers", () => {
        let r = new TokenReader(testTokens)

        const [t, ra] = r.find(word("bool"))

        if (t) {
            strictEqual(
                !!ra.matches(word("con")) && !!r.matches(word("false")),
                true
            )
        }

        r.endMatch()
        r.errors.throw()
    })

    it("doesn't find ; in [con bool false]", () => {
        let r = new TokenReader(testTokens)

        const [t, ra] = r.find(symbol(";"))

        throws(() => {
            r.errors.throw()
        })
    })
})
