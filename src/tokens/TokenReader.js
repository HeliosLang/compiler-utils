import { None, isSome } from "@helios-lang/type-utils"
import { ErrorCollector } from "../errors/ErrorCollector.js"
import { Group } from "./Group.js"
import { IntLiteral } from "./IntLiteral.js"
import { SymbolToken } from "./SymbolToken.js"
import { TokenSite } from "./TokenSite.js"
import { Word } from "./Word.js"

/**
 * @typedef {import("./Token.js").Token} Token
 */

/**
 * @template {Token} [T=Token]
 * @typedef {import("./TokenMatcher.js").TokenMatcher<T>} TokenMatcher
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
     * @type {TokenMatcher<Token>[][]}
     */
    failedMatches

    /**
     * @param {Token[]} tokens
     * @param {ErrorCollector} errors
     */
    constructor(tokens, errors = new ErrorCollector()) {
        this.tokens = tokens
        this.errors = errors
        this.i = 0
        this.failedMatches = []
    }

    assertEof() {
        if (this.i < this.tokens.length) {
            this.errors.syntax(this.tokens[this.i].site, "unexpected tokens")
        }
    }

    /**
     * @param {bigint | number} i
     * @returns {TokenReader}
     */
    expectInt(i) {
        return this.expectToken(new IntLiteral(BigInt(i)))
    }

    /**
     * @param {string} value
     * @returns {TokenReader}
     */
    expectSymbol(value) {
        return this.expectToken(new SymbolToken(value))
    }

    /**
     * @param {Token} token
     * @returns {TokenReader}
     */
    expectToken(token) {
        const t = this.readToken()

        if (t && !t.isEqual(token)) {
            this.errors.syntax(
                t.site,
                `expected ${token.toString()}, got ${t.toString()}`
            )
        }

        return this
    }

    /**
     * @param {string} value
     * @returns {TokenReader}
     */
    expectWord(value) {
        return this.expectToken(new Word(value))
    }

    /**
     * @returns {boolean}
     */
    isEof() {
        return this.i >= this.tokens.length
    }

    /**
     * @template {TokenMatcher[]} Matchers
     * @param  {[...Matchers]} matchers
     * @returns {Option<{[M in keyof Matchers]: Matchers[M] extends TokenMatcher<infer T> ? T : never}>}
     */
    matches(...matchers) {
        if (this.tokens.length - this.i < matchers.length) {
            return None
        } else {
            const res = matchers.every((m, j) =>
                m.matches(this.tokens[this.i + j])
            )

            if (res) {
                const matched = /** @type {any} */ (
                    this.tokens.slice(this.i, this.i + matchers.length)
                )
                this.failedMatches = []
                this.i += matchers.length
                return matched
            } else {
                return None
            }
        }
    }

    /**
     * @returns {TokenReader}
     */
    endMatch() {
        const n = this.failedMatches.length

        if (n > 0) {
            const longest = this.failedMatches.reduce(
                (prev, fm) => Math.max(prev, fm.length),
                0
            )

            this.errors.syntax(
                this.tokens[this.i].site,
                `expected ${this.failedMatches.map((fm, i) => fm.map((f) => f.toString()).join(" ") + (i < n - 2 ? ", " : i < n - 1 ? " or " : "")).join("")}, got ${this.tokens
                    .slice(this.i, longest)
                    .map((t) => t.toString())
                    .join(" ")}`
            )

            this.failedMatches = []
        }

        return this
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
