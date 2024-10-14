import { None } from "@helios-lang/type-utils"
import { makeSource, makeTokenizer, makeWord } from "../tokens/index.js"
import { makeSourceWriter } from "../tokens/SourceWriter.js"

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
    const tokens = makeTokenizer({
        source: makeSource({ content: raw }),
        options: {
            preserveComments: true
        }
    }).tokenize()
    const w = makeSourceWriter()

    let prev0 = /** @type {Option<Token>} */ (None)
    let prev1 = /** @type {Option<Token>} */ (None)
    let prev2 = /** @type {Option<Token>} */ (None)

    for (let t of tokens) {
        const sl = t.kind == "string" ? t : None

        if (
            prev0?.kind == "word" &&
            prev0.matches("import") &&
            prev1?.kind == "{" &&
            prev2?.kind == "word" &&
            prev2.matches("from") &&
            sl
        ) {
            w.writeToken(
                makeWord({ value: translator(sl.value), site: sl.site })
            )
        } else {
            w.writeToken(t)
        }

        if (t.kind != "comment") {
            prev0 = prev1
            prev1 = prev2
            prev2 = t
        }
    }

    return w.finalize()
}
