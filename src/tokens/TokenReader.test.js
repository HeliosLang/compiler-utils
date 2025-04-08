import { strictEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import { makeGroup } from "./GenericGroup.js"
import { makeSource } from "./Source.js"
import { makeTokenizer } from "./Tokenizer.js"
import { anyWord, group, symbol, wildcard, word } from "./TokenMatcher.js"
import { makeTokenReader } from "./TokenReader.js"
import { makeWord } from "./Word.js"

/**
 * @import { Token, TokenReader, Word } from "../index.js"
 */

describe(`TokenReader with tokens [con bool false]`, () => {
    const testTokens = [
        makeWord({ value: "con" }),
        makeWord({ value: "bool" }),
        makeWord({ value: "false" })
    ]

    it("matches [con bool false] using [word, word, wildcard]", () => {
        const r = makeTokenReader({ tokens: testTokens })

        let m

        if ((m = r.matches(word("con"), word("bool"), wildcard))) {
            strictEqual(m[1].value, "bool")
        } else {
            r.endMatch().errors.throw()
        }
    })

    it("fails when matching [con bool false] using [word, word, symbol]", () => {
        const r = makeTokenReader({ tokens: testTokens })

        let m
        if ((m = r.matches(word("con"), word("bool"), symbol(".")))) {
            m
        } else {
            throws(() => {
                r.endMatch()
                r.errors.throw()
            })
        }
    })
    ;("(program 0.0.0 (con bytes #))")
    it("matches [con bool false] using [word, word] [word]", () => {
        const r = makeTokenReader({ tokens: testTokens })

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
        /**
         * @type {TokenReader}
         */
        let r = makeTokenReader({
            tokens: [
                makeGroup({ kind: "(", fields: [testTokens], separators: [] })
            ]
        })
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
        let r = makeTokenReader({ tokens: testTokens })

        let m

        if ((m = r.findNext(word("bool")))) {
            /**
             * @satisfies {[TokenReader, Word]}
             */
            const [ra, _w] = m

            strictEqual(
                !!ra.matches(word("con")) && !!r.matches(word("false")),
                true
            )
        }

        r.endMatch()
        r.errors.throw()
    })

    it("reading after findLast(bool) returns false", () => {
        let tt = testTokens.slice(0, 2).concat(testTokens.slice(1))
        let r = makeTokenReader({ tokens: tt })

        let m

        if ((m = r.findLast(word("bool")))) {
            /**
             * @satisfies {[TokenReader, Word]}
             */
            const [ra, _w] = m

            strictEqual(
                !!ra.matches(word("con"), word("bool")) &&
                    !!r.matches(word("false")),
                true
            )
        }

        r.endMatch()
        r.errors.throw()
    })

    it("reading after findLastMatch(con, bool) returns false", () => {
        let r = makeTokenReader({ tokens: testTokens })

        let m

        if ((m = r.findLastMatch(word("con"), word("bool")))) {
            /**
             * @satisfies {[TokenReader, Word, Word]}
             */
            const [ra, _c, _b] = m

            strictEqual(ra.isEof() && !!r.matches(word("false")), true)
        }
    })

    it("doesn't find ; in [con bool false]", () => {
        let r = makeTokenReader({ tokens: testTokens })

        r.findNext(symbol(";"))

        throws(() => {
            r.errors.throw()
        })
    })

    it("readWord after readUntil(bool) returns false", () => {
        let r = makeTokenReader({ tokens: testTokens })

        const ra = r.readUntil(word("bool"))

        strictEqual(
            !!ra.matches(word("con")) && !!r.matches(word("bool")),
            true
        )
    })

    it("isEof is true after ending", () => {
        let r = makeTokenReader({ tokens: testTokens })

        r.end()

        strictEqual(r.isEof(), true)
    })
})

describe("TokenReader.insertSemicolons", () => {
    it("doesn't insert semicolons in example which already has semicolons", () => {
        const src = `
        a: Option[Int] = Option[Int]::Some{10};
        b: Option[ByteArray] = Option[ByteArray]::Some{#};
            
        (a, b).switch{
            (Some, _) => true,
            (None, None) => false,
            (_, Some) => false
        }`

        const tokens = makeTokenizer(makeSource(src), {
            preserveNewlines: true
        }).tokenize()

        const r = makeTokenReader({ tokens })

        const n = tokens.length

        const r2 = r.insertSemicolons(["=", ":", ".", ";"])

        strictEqual(r2.originalTokens.length, n)
    })

    it("inserts semicolon after single line comment (comments kept as tokens)", () => {
        const src = `
        a: Option[Int] = Option[Int]::Some{10};
        b: Option[ByteArray] = Option[ByteArray]::Some{#} // comment
            
        (a, b).switch{
            (Some, _) => true,
            (None, None) => false,
            (_, Some) => false
        }`

        const tokens = makeTokenizer(makeSource(src), {
            preserveComments: true,
            preserveNewlines: true
        }).tokenize()

        const r = makeTokenReader({ tokens })

        const n = tokens.length

        const r2 = r.insertSemicolons(["=", ":", ".", ";"])

        strictEqual(r2.originalTokens.length, n + 1)
    })

    it("inserts semicolon after single line comment (comments discarded)", () => {
        const src = `
        a: Option[Int] = Option[Int]::Some{10};
        b: Option[ByteArray] = Option[ByteArray]::Some{#} // comment
            
        (a, b).switch{
            (Some, _) => true,
            (None, None) => false,
            (_, Some) => false
        }`

        const tokens = makeTokenizer(makeSource(src), {
            preserveComments: false,
            preserveNewlines: true
        }).tokenize()

        const r = makeTokenReader({ tokens })

        const n = tokens.length

        const r2 = r.insertSemicolons(["=", ":", ".", ";"])

        strictEqual(r2.originalTokens.length, n + 1)
    })

    it("doesn't insert semicolon after before else keyword", () => {
        const src = `if() {
        } // THING
        else {}`

        const tokens = makeTokenizer(makeSource(src), {
            preserveComments: true,
            preserveNewlines: true
        }).tokenize()

        const r = makeTokenReader({ tokens })

        const n = tokens.length

        const r2 = r.insertSemicolons(["else"])

        strictEqual(r2.originalTokens.length, n)
    })

    it("doesn't insert semicolon after != operator", () => {
        const src = `thing.longAttributeName.someMethodName() != 
        otherThing.longAttributeName.someMethodName()`

        const tokens = makeTokenizer(makeSource(src), {
            preserveComments: true,
            preserveNewlines: true
        }).tokenize()

        const r = makeTokenReader({ tokens })

        const n = tokens.length

        const r2 = r.insertSemicolons(["!="])

        strictEqual(r2.originalTokens.length, n)
    })
})
