import { strictEqual } from "node:assert"
import { describe, it } from "node:test"
import { None } from "@helios-lang/type-utils"
import { Comment } from "./Comment.js"

describe(Comment.name, () => {
    it(`returns null when asserting a non Comment`, () => {
        strictEqual(Comment.from(0), None)
    })
})
