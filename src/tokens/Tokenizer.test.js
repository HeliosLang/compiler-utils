import { deepEqual, strictEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import { hexToBytes } from "@helios-lang/codec-utils"
import { makeSource } from "./Source.js"
import { makeTokenizer } from "./Tokenizer.js"

describe("Tokenizer", () => {
    it("tokenizes #54686543616B654973414C6965 as single ByteArrayLiteral", () => {
        const tokenizer = makeTokenizer(
            makeSource("testing tokenizer\n#54686543616B654973414C6965")
        )

        const tokens = tokenizer.tokenize()
        tokenizer.errors.throw()

        strictEqual(tokens.length, 3)
        const token = tokens[2]
        strictEqual(token.kind, "bytes")

        if (token.kind == "bytes") {
            deepEqual(token.value, hexToBytes("54686543616B654973414C6965"))
        } else {
            throw new Error("unexpected")
        }
    })

    it("tokenizes 000000000000000000000000000000000000012345 as 12345 if leading zeroes is allowed", () => {
        const tokenizer = makeTokenizer(
            makeSource(
                "testing tokenizer\n000000000000000000000000000000000000012345"
            ),
            { allowLeadingZeroes: true }
        )

        const tokens = tokenizer.tokenize()
        tokenizer.errors.throw()

        strictEqual(tokens.length, 3)
        const token = tokens[2]
        strictEqual(token.kind, "int")

        if (token.kind == "int") {
            deepEqual(token.value, 12345)
        } else {
            throw new Error("unexpected")
        }
    })

    it("fails to tokenize 000000000000000000000000000000000000012345 is leading zeroes isn't allowed", () => {
        const tokenizer = makeTokenizer(
            makeSource(
                "testing tokenizer\n000000000000000000000000000000000000012345"
            ),
            { allowLeadingZeroes: false }
        )

        throws(() => {
            tokenizer.tokenize()
            tokenizer.errors.throw()
        })
    })

    it("fails with a user-friendly error for '('", () => {
        const tokenizer = makeTokenizer(makeSource("("))

        throws(() => {
            tokenizer.tokenize()
            tokenizer.errors.throw()
        }, /unmatched/)
    })

    it("tokenizes '{\n/*comment*/\n}}' as group with 0 fields", () => {
        const src = `{
            // comment
        }`

        const tokenizer = makeTokenizer(makeSource(src), {
            preserveComments: true,
            preserveNewlines: true
        })

        const ts = tokenizer.tokenize()

        strictEqual(ts.length, 1)

        const t = ts[0]

        if (t.kind != "{") {
            throw new Error("expected group")
        }

        strictEqual(t.fields.length, 0)
    })
})
