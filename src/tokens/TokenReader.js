import { None, isSome } from "@helios-lang/type-utils"
import { ErrorCollector } from "../errors/ErrorCollector.js"
import { Word } from "./Word.js"
import { TokenSite } from "./TokenSite.js"
import { Group } from "./Group.js"

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
     * @returns {boolean}
     */
    isAtEnd() {
        return this.i >= this.tokens.length
    }

    /**
     * @param {string} kind
     * @returns {Option<TokenReader>}
     */
    readField(kind) {
        const g = this.readGroup(kind)

        if (!g) {
            return None
        }

        if (g.fields.length != 1) {
            this.errors.syntax(
                g.site,
                `expected 1 field, got ${g.fields.length} fields`
            )
            return None
        }

        return new TokenReader(g.fields[0], this.errors)
    }

    /**
     * @template T
     * @param {string} kind
     * @param {(tr: TokenReader) => T} callback
     * @param {{length?: number} | {minLength?: number, maxLength?: number}} options
     * @returns {T[]}
     */
    readFields(kind, callback, options = {}) {
        const g = this.readGroup(kind)

        if (!g) {
            return []
        }

        if ("length" in options && g.fields.length != options.length) {
            this.errors.syntax(
                g.site,
                `expected ${options.length} fields, got ${g.fields.length}`
            )
        }

        if (
            "minLength" in options &&
            g.fields.length < (options?.minLength ?? 0)
        ) {
            this.errors.syntax(
                g.site,
                `expected at least ${options.minLength} fields, got ${g.fields.length}`
            )
        }

        if (
            "maxLength" in options &&
            g.fields.length > (options?.maxLength ?? Number.POSITIVE_INFINITY)
        ) {
            this.errors.syntax(
                g.site,
                `expected at most ${options.maxLength} fields, got ${g.fields.length}`
            )
        }

        return g.fields.map((f) => callback(new TokenReader(f, this.errors)))
    }

    /**
     * @param {string} kind
     * @returns {Option<Group>}
     */
    readGroup(kind) {
        const t = this.readToken()

        if (t) {
            const g = Group.from(t)

            if (!g || !g.isKind(kind)) {
                this.errors.syntax(
                    t.site,
                    `expected ${kind}${Group.otherSymbol(kind)}, got ${t.toString(false)}`
                )
                return None
            }

            return g
        } else {
            return None
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
     * @param {Option<string>} value
     * @returns {Option<Word>}
     */
    readWord(value = None) {
        const t = this.readToken()
        const w = Word.from(t)

        if (t && !w) {
            this.errors.syntax(
                t.site,
                `expected ${value ? value : "word"}, got ${t.toString(false)}`
            )
        } else if (isSome(value)) {
            if (w && !w.matches(value)) {
                this.errors.syntax(
                    w.site,
                    `expected ${value}, got ${w.toString()}`
                )
                return None
            } else {
                return w
            }
        } else {
            return w
        }
    }
}
