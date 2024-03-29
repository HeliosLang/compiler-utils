import { describe, it } from "node:test"
import { Tokenizer } from "./Tokenizer.js"
import { Source } from "./Source.js"
import { deepEqual, strictEqual } from "node:assert"
import { ByteArrayLiteral } from "./ByteArrayLiteral.js"
import { hexToBytes } from "@helios-lang/codec-utils"

describe(Tokenizer.name, () => {
    it("tokenizes #54686543616B654973414C6965 as single ByteArrayLiteral", () => {
        const tokens = new Tokenizer(
            new Source("", "#54686543616B654973414C6965"),
            {}
        ).tokenize()

        strictEqual(tokens.length, 1)
        const token = tokens[0]
        strictEqual(token instanceof ByteArrayLiteral, true)

        if (token instanceof ByteArrayLiteral) {
            deepEqual(token.value, hexToBytes("54686543616B654973414C6965"))
        } else {
            throw new Error("unexpected")
        }
    })
})
