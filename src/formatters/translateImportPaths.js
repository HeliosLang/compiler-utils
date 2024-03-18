import { None } from "@helios-lang/codec-utils"
import {
    Group,
    Source,
    StringLiteral,
    TokenReader,
    Tokenizer,
    Word
} from "../tokens/index.js"
import { SourceWriter } from "../tokens/SourceWriter.js"

/**
 * @template T
 * @typedef {import("@helios-lang/codec-utils").Option<T>} Option
 */

/**
 * @typedef {import("../tokens/index.js").Token} Token
 */

/**
 * Preserves comments
 * @param {string} raw
 * @param {(path: string) => string} translator
 * @returns {string}
 */
export function translateImportPaths(raw, translator) {
    const tokens = new Tokenizer(new Source("", raw), {
        preserveComments: true
    }).tokenize()
    const w = new SourceWriter()

    /**
     * @type {Option<Token>}
     */
    let prev0 = None

    /**
     * @type {Option<Token>}
     */
    let prev1 = None

    /**
     * @type {Option<Token>}
     */
    let prev2 = None

    for (let t of tokens) {
        const sl = StringLiteral.from(t)
        if (
            Word.from(prev0)?.matches("import") &&
            Group.from(prev1)?.isKind("{") &&
            Word.from(prev2)?.matches("from") &&
            sl
        ) {
            w.writeToken(new Word(translator(sl.value), sl.site))
        } else {
            w.writeToken(t)
        }

        prev0 = prev1
        prev1 = prev2
        prev2 = t
    }

    return w.finalize()
}
