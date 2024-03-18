import { Source, StringLiteral, Tokenizer, Word } from "../tokens/index.js";

/**
 * @param {string} src 
 * @returns {[string, string]}
 */
export function readHeader(src) {
    const tokenizer = new Tokenizer(new Source("", src), {preserveComments: false})

    const gen = tokenizer.stream()

    // Don't parse the whole script, just 'eat' 2 tokens: `<purpose> <name>`
    const tokens = [];

    for (let i = 0; i < 2; i++) {
        const yielded = gen.next();
        if (yielded.done) {
            continue
        }

        tokens.push(yielded.value);
    }

    const purpose = Word.from(tokens[0])?.value ?? ""
    const name = StringLiteral.from(tokens[1])?.value ?? Word.from(tokens[1])?.value ?? ""

    return [purpose, name]
}