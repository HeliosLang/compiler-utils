import { isUndefined } from "@helios-lang/type-utils"
import { makeErrorCollector } from "../errors/index.js"
import { isGroup, makeGroup } from "./GenericGroup.js"
import { makeTokenSite } from "./TokenSite.js"

/**
 * @import { UnwrapSingleton } from "@helios-lang/type-utils"
 * @import { ErrorCollector, GenericGroup, MapMatchersToTokens, Token, TokenGroup, TokenMatcher, TokenReader, Word } from "src/index.js"
 */

/**
 * @param {{
 *   tokens: Token[]
 *   errors?: ErrorCollector
 * }} args
 * @returns {TokenReader}
 */
export function makeTokenReader(args) {
    return new TokenReaderImpl(args.tokens, args.errors ?? makeErrorCollector())
}

/**
 * @implements {TokenReader}
 */
class TokenReaderImpl {
    /**
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
    _i

    /**
     * @private
     * @type {TokenMatcher<Token>[][]}
     */
    _failedMatches

    /**
     * @param {Token[]} tokens
     * @param {ErrorCollector} errors
     */
    constructor(tokens, errors) {
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

                if (lastSite.end) {
                    lastSite = makeTokenSite({
                        file: lastSite.file,
                        startLine: lastSite.end.line,
                        startColumn: lastSite.end.column
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
     * @returns {[TokenReader, ...MapMatchersToTokens<Matchers>] | undefined}
     */
    findNext(...matchers) {
        const i0 = this._i

        const res = /** @type {any} */ (this.findNextInternal(...matchers))

        if (isUndefined(res)) {
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
     * @returns {[TokenReader, ...MapMatchersToTokens<Matchers>] | undefined}
     */
    findNextMatch(...matchers) {
        const res = /** @type {any} */ (this.findNextInternal(...matchers))

        if (isUndefined(res)) {
            // TODO: add entry to `this._failedMatches`
        }

        return res
    }

    /**
     * @private
     * @template {TokenMatcher[]} Matchers
     * @param {[...Matchers]} matchers
     * @returns {[TokenReader, ...MapMatchersToTokens<Matchers>] | undefined}
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
                                isGroup(t) ? augmentGroup(this, t) : t
                            )
                    )

                    this._i = i + n
                    this._failedMatches = []

                    return /** @type {any} */ ([
                        new TokenReaderImpl(
                            this.tokens.slice(i0, i),
                            this.errors
                        ),
                        ...matched
                    ])
                }
            }
        }

        return undefined
    }

    /**
     * Looks for the last token that matches the `matcher`
     * Returns both the token and another TokenReader for preceding tokens
     * @template {TokenMatcher[]} Matchers
     * @param {[...Matchers]} matchers
     * @returns {[TokenReader, ...MapMatchersToTokens<Matchers>] | undefined}
     */
    findLast(...matchers) {
        const i0 = this._i

        const res = /** @type {any} */ (this.findLastInternal(...matchers))

        if (isUndefined(res)) {
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
     * @returns {[TokenReader, ...MapMatchersToTokens<Matchers>] | undefined}
     */
    findLastMatch(...matchers) {
        const res = /** @type {any} */ (this.findLastInternal(...matchers))

        if (isUndefined(res)) {
            // TODO: add entry to `this._failedMatches`
        }

        return res
    }

    /**
     * @private
     * @template {TokenMatcher[]} Matchers
     * @param {[...Matchers]} matchers
     * @returns {[TokenReader, ...MapMatchersToTokens<Matchers>] | undefined}
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
                                isGroup(t) ? augmentGroup(this, t) : t
                            )
                    )

                    this._i = i + n
                    this._failedMatches = []

                    return /** @type {any} */ ([
                        new TokenReaderImpl(
                            this.tokens.slice(i0, i),
                            this.errors
                        ),
                        ...matched
                    ])
                }
            }
        }

        return undefined
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
            let reader = new TokenReaderImpl(this.tokens, this.errors)

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
     * @returns {UnwrapSingleton<MapMatchersToTokens<Matchers>> | undefined}
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
                        .map((t) => (isGroup(t) ? augmentGroup(this, t) : t))
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
        return undefined
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

    unreadToken() {
        this._i = Math.max(this._i - 1, 0)
    }
}

/**
 * @param {TokenReader} r
 * @param {GenericGroup<Token[]>} t
 * @returns {GenericGroup<TokenReader>}
 */
function augmentGroup(r, t) {
    return makeGroup({
        kind: t.kind,
        fields: t.fields.map((f) => new TokenReaderImpl(f, r.errors)),
        separators: t.separators,
        site: t.site
    })
}
