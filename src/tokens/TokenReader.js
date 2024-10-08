import { None, isNone, isSome } from "@helios-lang/type-utils"
import { ErrorCollector } from "../errors/ErrorCollector.js"
import { Group } from "./Group.js"
import { TokenSite } from "./TokenSite.js"
import { Word } from "./Word.js"

/**
 * @template {Token} [T=Token]
 * @typedef {import("./TokenMatcher.js").TokenMatcher<T>} TokenMatcher
 */

/**
 * @typedef {import("../errors/index.js").ErrorCollectorI} ErrorCollectorI
 * @typedef {import("./Token.js").Token} Token
 * @typedef {import("./Token.js").WordI} WordI
 */

/**
 * @template {Token} T
 * @typedef {T extends Group ? Group<TokenReaderI> : T} AugmentGroup
 */

/**
 * @template {TokenMatcher[]} Matchers
 * @typedef {{[M in keyof Matchers]: Matchers[M] extends TokenMatcher<infer T> ? AugmentGroup<T> : never}} MatcherTokens
 */

/**
 * @template {(Group<TokenReaderI> | Token)[]} Tokens
 * @typedef {Tokens extends [infer T] ? T : Tokens} UnwrapSingleton
 */

/**
 * @typedef {{
 *   tokens: Token[]
 *   errors: ErrorCollectorI
 *   rest: Token[]
 *   assert: <Matchers extends TokenMatcher[]>(...matchers: [...Matchers]) => TokenReaderI
 *   end(): void
 *   findNext: <Matchers extends TokenMatcher[]>(...matchers: [...Matchers]) => Option<[TokenReaderI, ...MatcherTokens<Matchers>]>
 *   findNextMatch: <Matchers extends TokenMatcher[]>(...matchers: [...Matchers]) => Option<[TokenReaderI, ...MatcherTokens<Matchers>]>
 *   findLast: <Matchers extends TokenMatcher[]>(...matchers: [...Matchers]) => Option<[TokenReaderI, ...MatcherTokens<Matchers>]>
 *   findLastMatch: <Matchers extends TokenMatcher[]>(...matchers: [...Matchers]) => Option<[TokenReaderI, ...MatcherTokens<Matchers>]>
 *   readUntil: <Matchers extends TokenMatcher[]>(...matchers: [...Matchers]) => TokenReaderI
 *   isEof(): boolean
 *   matches: <Matchers extends TokenMatcher[]>(...matchers: [...Matchers]) => Option<UnwrapSingleton<MatcherTokens<Matchers>>>
 *   endMatch(throwFail?: boolean | string): TokenReaderI
 *   readField(kind: string): Option<TokenReaderI>
 *   readFields: <T>(kind: string, callback: (tr: TokenReaderI) => T, options: ({length?: number} | {minLength?: number, maxLength?: number})) => T[]
 *   readGroup(kind: string): Option<Group>
 *   readNonKeyword(): Option<WordI>
 *   readToken(): Option<Token>
 *   readWord(value?: Option<string>): Option<WordI>
 *   unreadToken(): void
 * }} TokenReaderI
 */

/**
 * @implements {TokenReaderI}
 */
export class TokenReader {
    /**
     * @readonly
     * @type {Token[]}
     */
    tokens

    /**
     * @readonly
     * @type {ErrorCollectorI}
     */
    errors

    /**
     * @private
     * @type {number}
     */
    _i

    /**
     * @private
     * @type {TokenMatcher<Token>[][]}
     */
    _failedMatches

    /**
     * @param {Token[]} tokens
     * @param {ErrorCollectorI} errors
     */
    constructor(tokens, errors = new ErrorCollector()) {
        this.tokens = tokens
        this.errors = errors
        this._i = 0
        this._failedMatches = []
    }

    /**
     * @type {Token[]}
     */
    get rest() {
        return this.tokens.slice(this._i)
    }

    /**
     * @template {TokenMatcher[]} Matchers
     * @param  {[...Matchers]} matchers
     * @returns {TokenReader}
     */
    assert(...matchers) {
        matchers.forEach((m, j) => {
            const i = this._i + j

            if (i == this.tokens.length) {
                let lastSite = this.tokens[this.tokens.length - 1].site

                if (
                    lastSite instanceof TokenSite &&
                    lastSite.endLine &&
                    lastSite.endColumn
                ) {
                    lastSite = new TokenSite({
                        file: lastSite.file,
                        startLine: lastSite.endLine,
                        startColumn: lastSite.endColumn
                    })
                }

                this.errors.syntax(lastSite, "expected more tokens")
            } else if (i < this.tokens.length) {
                if (!m.matches(this.tokens[i])) {
                    this.errors.syntax(
                        this.tokens[i].site,
                        `expected ${m.toString()}, got ${this.tokens[i].toString()}`
                    )
                }
            }
        })

        this._i = this._i + matchers.length

        return this
    }

    end() {
        if (this._i < this.tokens.length) {
            // TODO: should we merge the contexts of all the remaining tokens
            this.errors.syntax(this.tokens[this._i].site, "unexpected tokens")

            this._i = this.tokens.length
        }
    }

    /**
     * Looks for the next token that matches the `matcher`
     * Returns both the token and another TokenReader for preceding tokens
     * @template {TokenMatcher[]} Matchers
     * @param {[...Matchers]} matchers
     * @returns {Option<[TokenReader, ...MatcherTokens<Matchers>]>}
     */
    findNext(...matchers) {
        const i0 = this._i

        const res = /** @type {any} */ (this.findNextInternal(...matchers))

        if (isNone(res)) {
            this.errors.syntax(
                this.tokens[i0].site,
                `${matchers.map((m) => m.toString()).join(", ")} not found`
            )
        }

        return res
    }

    /**
     * Looks for the last token that matches the `matcher`
     * Returns both the token and another TokenReader for preceding tokens
     * @template {TokenMatcher[]} Matchers
     * @param {[...Matchers]} matchers
     * @returns {Option<[TokenReader, ...MatcherTokens<Matchers>]>}
     */
    findNextMatch(...matchers) {
        const res = /** @type {any} */ (this.findNextInternal(...matchers))

        if (isNone(res)) {
            // TODO: add entry to `this._failedMatches`
        }

        return res
    }

    /**
     * @private
     * @template {TokenMatcher[]} Matchers
     * @param {[...Matchers]} matchers
     * @returns {Option<[TokenReader, ...MatcherTokens<Matchers>]>}
     */
    findNextInternal(...matchers) {
        const n = matchers.length

        const i0 = this._i
        for (let i = i0; i < this.tokens.length; i++) {
            if (this.tokens.length - i >= n) {
                const res = matchers.every((m, j) =>
                    m.matches(this.tokens[i + j])
                )

                if (res) {
                    const matched = /** @type {any} */ (
                        this.tokens
                            .slice(i, i + n)
                            .map((t) =>
                                t instanceof Group ? augmentGroup(this, t) : t
                            )
                    )

                    this._i = i + n
                    this._failedMatches = []

                    return /** @type {any} */ ([
                        new TokenReader(this.tokens.slice(i0, i), this.errors),
                        ...matched
                    ])
                }
            }
        }

        return None
    }

    /**
     * Looks for the last token that matches the `matcher`
     * Returns both the token and another TokenReader for preceding tokens
     * @template {TokenMatcher[]} Matchers
     * @param {[...Matchers]} matchers
     * @returns {Option<[TokenReader, ...MatcherTokens<Matchers>]>}
     */
    findLast(...matchers) {
        const i0 = this._i

        const res = /** @type {any} */ (this.findLastInternal(...matchers))

        if (isNone(res)) {
            this.errors.syntax(
                this.tokens[i0].site,
                `${matchers.map((m) => m.toString()).join(", ")} not found`
            )
        }

        return res
    }

    /**
     * Looks for the last token that matches the `matcher`
     * Returns both the token and another TokenReader for preceding tokens
     * @template {TokenMatcher[]} Matchers
     * @param {[...Matchers]} matchers
     * @returns {Option<[TokenReader, ...MatcherTokens<Matchers>]>}
     */
    findLastMatch(...matchers) {
        const res = /** @type {any} */ (this.findLastInternal(...matchers))

        if (isNone(res)) {
            // TODO: add entry to `this._failedMatches`
        }

        return res
    }

    /**
     * @private
     * @template {TokenMatcher[]} Matchers
     * @param {[...Matchers]} matchers
     * @returns {Option<[TokenReader, ...MatcherTokens<Matchers>]>}
     */
    findLastInternal(...matchers) {
        const n = matchers.length

        const i0 = this._i
        for (let i = this.tokens.length - 1; i >= i0; i--) {
            if (this.tokens.length - i >= n) {
                const res = matchers.every((m, j) =>
                    m.matches(this.tokens[i + j])
                )

                if (res) {
                    const matched = /** @type {any} */ (
                        this.tokens
                            .slice(i, i + n)
                            .map((t) =>
                                t instanceof Group ? augmentGroup(this, t) : t
                            )
                    )

                    this._i = i + n
                    this._failedMatches = []

                    return /** @type {any} */ ([
                        new TokenReader(this.tokens.slice(i0, i), this.errors),
                        ...matched
                    ])
                }
            }
        }

        return None
    }

    /**
     * Like `find`, looks for the next token that matches the `matcher`
     * Returns a TokenReader for preceding tokens, keeps the matched token in the buffer
     * Reads until the end if not found
     * @template {TokenMatcher[]} Matchers
     * @param {[...Matchers]} matchers
     * @returns {TokenReader}
     */
    readUntil(...matchers) {
        const n = matchers.length

        let m

        if ((m = this.findNextInternal(...matchers))) {
            let [reader] = m

            this._i -= n

            return reader
        } else {
            let reader = new TokenReader(this.tokens, this.errors)

            reader._i = this._i
            this._i = this.tokens.length

            return reader
        }
    }

    /**
     * @returns {boolean}
     */
    isEof() {
        return this._i >= this.tokens.length
    }

    /**
     * @template {TokenMatcher[]} Matchers
     * @param  {[...Matchers]} matchers
     * @returns {Option<UnwrapSingleton<MatcherTokens<Matchers>>>}
     */
    matches(...matchers) {
        const n = matchers.length

        if (this.tokens.length - this._i >= n) {
            const res = matchers.every((m, j) =>
                m.matches(this.tokens[this._i + j])
            )

            if (res) {
                const matched = /** @type {any} */ (
                    this.tokens
                        .slice(this._i, this._i + n)
                        .map((t) =>
                            t instanceof Group ? augmentGroup(this, t) : t
                        )
                )
                this._failedMatches = []
                this._i += n

                if (matched.length == 1) {
                    return matched[0]
                } else {
                    return matched
                }
            }
        }

        this._failedMatches.push(matchers)
        return None
    }

    /**
     * @param {boolean | string} throwFail - defaults to true. `throwFail` as a string specifies a custom error message if all matches failed
     * @returns {TokenReader}
     */
    endMatch(throwFail = true) {
        const n = this._failedMatches.length

        if (n > 0) {
            if (throwFail) {
                const i = Math.min(this._i, this.tokens.length - 1)
                if (typeof throwFail == "string") {
                    this.errors.syntax(this.tokens[i].site, throwFail)
                } else {
                    const longest = this._failedMatches.reduce(
                        (prev, fm) => Math.max(prev, fm.length),
                        0
                    )

                    this.errors.syntax(
                        this.tokens[i].site,
                        `expected '${this._failedMatches.map((fm, i) => fm.map((f) => f.toString()).join(" ") + (i < n - 2 ? ", " : i < n - 1 ? " or " : "")).join("")}', got '${this.tokens
                            .slice(this._i, longest)
                            .map((t) => t.toString())
                            .join(" ")}'`
                    )
                }
            }

            this._failedMatches = []
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
     * @param {(tr: TokenReaderI) => T} callback
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
        const t = this.tokens[this._i]
        this._i += 1

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

    unreadToken() {
        this._i = Math.max(this._i - 1, 0)
    }
}

/**
 * @param {TokenReaderI} r
 * @param {Group<Token[]>} t
 * @returns {Group<TokenReader>}
 */
function augmentGroup(r, t) {
    return new Group(
        t.kind,
        t.fields.map((f) => new TokenReader(f, r.errors)),
        t.separators,
        t.site
    )
}
