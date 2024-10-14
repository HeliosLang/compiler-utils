import { bytesToHex, equalsBytes } from "@helios-lang/codec-utils"
import { None } from "@helios-lang/type-utils"
import { getOtherGroupSymbol } from "./GenericGroup.js"
import { makeSymbolToken } from "./SymbolToken.js"
import { isGroup } from "./Token.js"

/**
 * @template {string} [T=string]
 * @typedef {import("./Token.js").SymbolToken<T>} SymbolToken
 */

/**
 * @typedef {import("./Token.js").BoolLiteral} BoolLiteral
 * @typedef {import("./Token.js").ByteArrayLiteral} ByteArrayLiteral
 * @typedef {import("./Token.js").IntLiteral} IntLiteral
 * @typedef {import("./Token.js").RealLiteral} RealLiteral
 * @typedef {import("./Token.js").StringLiteral} StringLiteral
 * @typedef {import("./Token.js").Token} Token
 * @typedef {import("./Token.js").TokenGroup} TokenGroup
 * @typedef {import("./Token.js").Word} Word
 */

/**
 * The generic type parameter must be used somewhere inside this definition, otherwise typescript fails to infer T inside the TokenReader.matches method
 * The easiest way to do this is return a truthy value from matches() instead of just a boolean
 * @template {Token} [T=Token]
 * @typedef {{
 *   matches: (t: Token) => Option<T>
 *   toString: () => string
 * }} TokenMatcher
 */

/**
 * @type {TokenMatcher<SymbolToken>}
 */
export const anySymbol = {
    matches: (t) => (t.kind == "symbol" ? t : None),
    toString: () => "<symbol>"
}

/**
 * @type {TokenMatcher<Word>}
 */
export const anyWord = {
    matches: (t) => (t.kind == "word" ? t : None),
    toString: () => "<word>"
}

/**
 * @param {Option<boolean>} value
 * @returns {TokenMatcher<BoolLiteral>}
 */
export function boollit(value = None) {
    return {
        matches: (t) =>
            t.kind == "bool" && (value ? t.value === value : true) ? t : None,
        toString: () => (value ? (value ? "true" : "false") : "true | false")
    }
}

/**
 * @param {Option<number[] | Uint8Array>} value
 * @returns {TokenMatcher<ByteArrayLiteral>}
 */
export function byteslit(value = None) {
    return {
        matches: (t) =>
            t.kind == "bytes" && (value ? equalsBytes(t.value, value) : true)
                ? t
                : None,
        toString: () =>
            value ? `#${bytesToHex(Array.from(value))}` : "<bytes>"
    }
}

/**
 * @param {string} kind
 * @param {Option<{length: number} | {minLength: number} | {maxLength: number} | {minLength: number, maxLength: number }>} options
 * @returns {TokenMatcher<TokenGroup>}
 */
export function group(kind, options = None) {
    /**
     * @param {TokenGroup} g
     * @returns {boolean}
     */
    function matchLength(g) {
        if (options) {
            const n = g.fields.length
            if ("length" in options) {
                return n == options.length
            } else {
                if ("minLength" in options && n < options.minLength) {
                    return false
                }

                if ("maxLength" in options && n > options.maxLength) {
                    return false
                }

                return true
            }
        } else {
            return true
        }
    }

    return {
        matches: (t) =>
            isGroup(t) && t.kind == kind && matchLength(t) ? t : None,
        toString: () =>
            `${kind}${options && "length" in options ? `<${options.length} entries>` : "..."}${getOtherGroupSymbol(kind)}`
    }
}

/**
 * @param {Option<string | number | bigint>} value
 * @returns {TokenMatcher<IntLiteral>}
 */
export function intlit(value = None) {
    return {
        matches: (t) =>
            t.kind == "int" && (value ? t.value == BigInt(value) : true)
                ? t
                : None,
        toString: () => (value ? `${value.toString()}` : "<int>")
    }
}

/**
 * @template {TokenMatcher[]} Matchers
 * @param {[...Matchers]} matchers
 * @returns {TokenMatcher<Matchers extends Array<TokenMatcher<infer T>> ? T : never>}
 */
export function oneOf(matchers) {
    return {
        matches: (t) => {
            for (let matcher of matchers) {
                const match = matcher.matches(t)

                if (match) {
                    return /** @type {any} */ (match)
                }
            }

            return None
        },
        toString: () => matchers.map((m) => m.toString()).join(" | ")
    }
}

/**
 * @type {TokenMatcher<RealLiteral>}
 */
export const reallit = {
    matches: (t) => (t.kind == "real" ? t : None),
    toString: () => "<real>"
}

/**
 * @param {Option<string>} value
 * @returns {TokenMatcher<StringLiteral>}
 */
export function strlit(value = None) {
    return {
        matches: (t) =>
            t.kind == "string" && (value ? t.value == value : true) ? t : None,
        toString: () => (value ? `"${value.toString()}"` : "<string>")
    }
}

/**
 * @param {string} v
 * @returns {TokenMatcher<SymbolToken>}
 */
export function symbol(v) {
    const s = makeSymbolToken({ value: v })

    return {
        matches: (t) => (s.isEqual(t) ? s : None),
        toString: () => v
    }
}

/**
 * @type {TokenMatcher<Token>}
 */
export const wildcard = {
    matches: (t) => t,
    toString: () => "*"
}

/**
 * @param {string} s
 * @param {Option<{caseInsensitive: boolean}>} options
 * @returns {TokenMatcher<Word>}
 */
export function word(s, options = None) {
    return {
        matches: (t) =>
            t.kind == "word" &&
            (options?.caseInsensitive
                ? t.value.toLowerCase() == s.toLowerCase()
                : t.value == s)
                ? t
                : None,
        toString: () => s
    }
}
