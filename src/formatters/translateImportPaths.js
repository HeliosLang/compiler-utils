import { makeSource, makeTokenizer, makeWord } from "../tokens/index.js"
import { makeSourceWriter } from "../tokens/SourceWriter.js"

/**
 * @import  { Token } from "../index.js"
 */

/**
 * Preserves comments
 * @param {string} raw
 * @param {(path: string) => string} translator
 * @returns {string}
 */
export function translateImportPaths(raw, translator) {
    const tokens = makeTokenizer(makeSource(raw), {
        preserveComments: true
    }).tokenize()
    const w = makeSourceWriter()

    let prev0 = /** @type {Token | undefined} */ (undefined)
    let prev1 = /** @type {Token | undefined} */ (undefined)
    let prev2 = /** @type {Token | undefined} */ (undefined)

    for (let t of tokens) {
        const sl = t.kind == "string" ? t : undefined

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
