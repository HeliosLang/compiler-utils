import { describe, it } from "node:test"
import { Tokenizer } from "./Tokenizer.js"
import { Source } from "./Source.js"
import { deepEqual, strictEqual, throws } from "node:assert"
import { ByteArrayLiteral } from "./ByteArrayLiteral.js"
import { hexToBytes } from "@helios-lang/codec-utils"
import { IntLiteral } from "./IntLiteral.js"

describe(Tokenizer.name, () => {
    it("tokenizes #54686543616B654973414C6965 as single ByteArrayLiteral", () => {
        const tokenizer = new Tokenizer(
            new Source("", "#54686543616B654973414C6965"),
            {}
        )

        const tokens = tokenizer.tokenize()
        tokenizer.errors.throw()

        strictEqual(tokens.length, 1)
        const token = tokens[0]
        strictEqual(token instanceof ByteArrayLiteral, true)

        if (token instanceof ByteArrayLiteral) {
            deepEqual(token.value, hexToBytes("54686543616B654973414C6965"))
        } else {
            throw new Error("unexpected")
        }
    })

    it("tokenizes 000000000000000000000000000000000000012345 as 12345 if leading zeroes is allowed", () => {
        const tokenizer = new Tokenizer(
            new Source("", "000000000000000000000000000000000000012345"),
            { allowLeadingZeroes: true }
        )

        const tokens = tokenizer.tokenize()
        tokenizer.errors.throw()

        strictEqual(tokens.length, 1)
        const token = tokens[0]
        strictEqual(token instanceof IntLiteral, true)

        if (token instanceof IntLiteral) {
            deepEqual(token.value, 12345)
        } else {
            throw new Error("unexpected")
        }
    })

    it("fails to tokenize 000000000000000000000000000000000000012345 is leading zeroes isn't allowed", () => {
        const tokenizer = new Tokenizer(
            new Source("", "000000000000000000000000000000000000012345"),
            { allowLeadingZeroes: false }
        )

        throws(() => {
            tokenizer.tokenize()
            tokenizer.errors.throw()
        })
    })
})
