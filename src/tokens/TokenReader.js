import { isUndefined } from "@helios-lang/type-utils"
import { makeErrorCollector } from "../errors/index.js"
import { isGroup, makeGroup } from "./GenericGroup.js"
import { makeSymbolToken } from "./SymbolToken.js"
import { makeTokenSite } from "./TokenSite.js"

/**
 * @import { UnwrapSingleton } from "@helios-lang/type-utils"
 * @import { ErrorCollector, GenericGroup, MapMatchersToTokens, Token, TokenGroup, TokenMatcher, TokenReader, Word } from "../index.js"
 */

/**
 * @param {{
 *   tokens: Token[]
 *   errors?: ErrorCollector
 *   ignoreNewlines?: boolean
 * }} args
 * @returns {TokenReader}
 */
export function makeTokenReader(args) {
    return new TokenReaderImpl(
        args.tokens,
        args.errors ?? makeErrorCollector(),
        args.ignoreNewlines ?? false
    )
}

/**
 * @implements {TokenReader}
 */
class TokenReaderImpl {
    /**
     * Tokens including newlines
     * Can be used for semicolon injection
     * @readonly
     * @type {Token[]}
     */
    originalTokens

    /**
     * Tokens excluding newlines
     * (Newlines are ignored by the matchers)
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
     * @readonly
     * @type {boolean}
     */
    _ignoreNewlines

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
     * @param {boolean} ignoreNewlines
     */
    constructor(tokens, errors, ignoreNewlines) {
        this.originalTokens = tokens
        this.tokens = ignoreNewlines
            ? tokens.filter((t) => t.kind != "newline")
            : tokens
        this.errors = errors
        this.originalTokens
        this._i = 0
        this._failedMatches = []
        this._ignoreNewlines = ignoreNewlines
    }

    /**
     * Excludes newlines
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
                            .map((t) => (isGroup(t) ? this.augmentGroup(t) : t))
                    )

                    this._i = i + n
                    this._failedMatches = []

                    return /** @type {any} */ ([
                        new TokenReaderImpl(
                            this.tokens.slice(i0, i),
                            this.errors,
                            this._ignoreNewlines
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
                            .map((t) => (isGroup(t) ? this.augmentGroup(t) : t))
                    )

                    this._i = i + n
                    this._failedMatches = []

                    return /** @type {any} */ ([
                        new TokenReaderImpl(
                            this.tokens.slice(i0, i),
                            this.errors,
                            this._ignoreNewlines
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
            let reader = new TokenReaderImpl(
                this.tokens,
                this.errors,
                this._ignoreNewlines
            )

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
                        .map((t) => (isGroup(t) ? this.augmentGroup(t) : t))
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

    /**
     * Semicolons are inserted right before a newline token if the following conditions hold:
     *   1. the first non-comment token before the NL token isn't a NL or a known multiline operator
     *   2. the first non-comment/non-NL token after the NL token isn't a known multiline operator
     *   3. the NL token isn't the first token in the reader
     *   4. the NL token isn't the last token in the reader
     * @param {string[]} multilineOperators - can be Symbol or Keyword
     * @returns {TokenReader}
     */
    insertSemicolons(multilineOperators) {
        const orig = this.originalTokens

        /**
         * @param {Token} t
         * @returns {boolean}
         */
        const isMultilineOperator = (t) => {
            if (t.kind == "symbol" || t.kind == "word") {
                return multilineOperators.includes(t.value)
            } else {
                return false
            }
        }

        /**
         * @type {Token[]}
         */
        const tokens = []

        /**
         * @type {undefined | Token}
         */
        let prev

        const n = orig.length

        for (let i = 0; i < n; i++) {
            const t = orig[i]

            // the NL isn't the first token nor the last token
            if (t.kind == "newline" && i > 0 && i < n - 1) {
                // the previous token isn't another NL, nor a known multiline operator
                if (
                    prev &&
                    prev.kind != "newline" &&
                    !isMultilineOperator(prev)
                ) {
                    const next = orig
                        .slice(i + 1)
                        .find((t) => t.kind != "comment" && t.kind != "newline")

                    // the next token isn't a known multiline operator
                    if (next && !isMultilineOperator(next)) {
                        tokens.push(makeSymbolToken(";", t.site))
                    }
                }
            }

            tokens.push(t)

            if (t.kind != "comment") {
                prev = t
            }
        }

        const reader = new TokenReaderImpl(
            tokens,
            this.errors,
            this._ignoreNewlines
        )

        reader._i = reader.tokens.findIndex((t) => t == this.tokens[this._i])

        if (reader._i == -1) {
            throw new Error(
                "unable to keep TokenReader position in insertSemicolons"
            )
        }

        return reader
    }

    /**
     * @private
     * @param {GenericGroup<Token[]>} t
     * @returns {GenericGroup<TokenReader>}
     */
    augmentGroup(t) {
        return makeGroup({
            kind: t.kind,
            fields: t.fields.map(
                (f) => new TokenReaderImpl(f, this.errors, this._ignoreNewlines)
            ),
            separators: t.separators,
            site: t.site
        })
    }
}
