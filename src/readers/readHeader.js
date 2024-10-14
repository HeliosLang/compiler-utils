import { makeSource, makeTokenizer } from "../tokens/index.js"

/**
 * @param {string} src
 * @returns {[string, string]}
 */
export function readHeader(src) {
    const tokenizer = makeTokenizer({
        source: makeSource({ content: src }),
        options: {
            preserveComments: false
        }
    })

    const gen = tokenizer.stream()

    // Don't parse the whole script, just 'eat' 2 tokens: `<purpose> <name>`
    const tokens = []

    for (let i = 0; i < 2; i++) {
        const yielded = gen.next()
        if (yielded.done) {
            continue
        }

        tokens.push(yielded.value)
    }

    const purpose = tokens[0]?.kind == "word" ? tokens[0].value : ""
    const name =
        tokens[1]?.kind == "string"
            ? tokens[1]?.value
            : tokens[1]?.kind == "word"
              ? tokens[1]?.value
              : ""

    return [purpose, name]
}
