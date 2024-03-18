import { None } from "@helios-lang/codec-utils"
import { ErrorCollector } from "../errors/ErrorCollector.js"
import { Word } from "./Word.js"
import { TokenSite } from "./TokenSite.js"

/**
 * @template T
 * @typedef {import("@helios-lang/codec-utils").Option<T>} Option
 */

/**
 * @typedef {import("./Token.js").Token} Token
 */

export class TokenReader {
    /**
     * @private
     * @readonly
     * @type {Token[]}
     */
    tokens

    /**
     * @readonly
     * @type {ErrorCollector}
     */
    errors

    /**
     * @private
     * @type {number}
     */
    i

    /**
     * @param {Token[]} tokens
     * @param {ErrorCollector} errors
     */
    constructor(tokens, errors = new ErrorCollector()) {
        this.tokens = tokens
        this.errors = errors
        this.i = 0
    }

    /**
     * @returns {Option<Token>}
     */
    readToken() {
        const t = this.tokens[this.i]
        this.i += 1

        if (!t) {
            this.errors.syntax(
                this.tokens[this.tokens.length - 1]?.site ?? TokenSite.dummy(),
                `unexpected EOF`
            )
            return None
        }

        return t
    }

    /**
     * @returns {Option<Word>}
     */
    readWord() {
        const t = this.readToken()
        const w = Word.from(t)

        if (t && !w) {
            this.errors.syntax(
                t.site,
                `expected word, got ${t.toString(false)}`
            )
        } else {
            return w
        }
    }

    /**
     * @returns {Option<Word>}
     */
    readNonKeyword() {
        const w = this.readWord()

        if (w && w.isKeyword()) {
            this.errors.syntax(w.site, `unexpected keyword ${w.toString()}`)
            return None
        } else {
            return w
        }
    }

    /**
     * @param {string} value
     */
    readSpecificWord(value) {
        const w = this.readWord()

        if (w && !w.matches(value)) {
            this.errors.syntax(w.site, `expected ${value}, got ${w.toString()}`)
            return None
        } else {
            return w
        }
    }
}
