import { bytesToHex, equalsBytes } from "@helios-lang/codec-utils"
import { getOtherGroupSymbol, isGroup } from "./GenericGroup.js"
import { makeSymbolToken } from "./SymbolToken.js"

/**
 * @import { BoolLiteral, ByteArrayLiteral, IntLiteral, RealLiteral, StringLiteral, SymbolToken, Token, TokenGroup, TokenMatcher, Word } from "src/index.js"
 */

/**
 * @type {TokenMatcher<SymbolToken>}
 */
export const anySymbol = {
    matches: (t) => (t.kind == "symbol" ? t : undefined),
    toString: () => "<symbol>"
}

/**
 * @type {TokenMatcher<Word>}
 */
export const anyWord = {
    matches: (t) => (t.kind == "word" ? t : undefined),
    toString: () => "<word>"
}

/**
 * @param {boolean | undefined} value
 * @returns {TokenMatcher<BoolLiteral>}
 */
export function boollit(value = undefined) {
    return {
        matches: (t) =>
            t.kind == "bool" && (value ? t.value === value : true)
                ? t
                : undefined,
        toString: () => (value ? (value ? "true" : "false") : "true | false")
    }
}

/**
 * @param {number[] | Uint8Array | undefined} value
 * @returns {TokenMatcher<ByteArrayLiteral>}
 */
export function byteslit(value = undefined) {
    return {
        matches: (t) =>
            t.kind == "bytes" && (value ? equalsBytes(t.value, value) : true)
                ? t
                : undefined,
        toString: () =>
            value ? `#${bytesToHex(Array.from(value))}` : "<bytes>"
    }
}

/**
 * @param {string} kind
 * @param {{length: number} | {minLength: number} | {maxLength: number} | {minLength: number, maxLength: number } | undefined} options
 * @returns {TokenMatcher<TokenGroup>}
 */
export function group(kind, options = undefined) {
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
            isGroup(t) && t.kind == kind && matchLength(t) ? t : undefined,
        toString: () =>
            `${kind}${options && "length" in options ? `<${options.length} entries>` : "..."}${getOtherGroupSymbol(kind)}`
    }
}

/**
 * @param {string | number | bigint | undefined} value
 * @returns {TokenMatcher<IntLiteral>}
 */
export function intlit(value = undefined) {
    return {
        matches: (t) =>
            t.kind == "int" && (value ? t.value == BigInt(value) : true)
                ? t
                : undefined,
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

            return undefined
        },
        toString: () => matchers.map((m) => m.toString()).join(" | ")
    }
}

/**
 * @type {TokenMatcher<RealLiteral>}
 */
export const reallit = {
    matches: (t) => (t.kind == "real" ? t : undefined),
    toString: () => "<real>"
}

/**
 * @param {string | undefined} value
 * @returns {TokenMatcher<StringLiteral>}
 */
export function strlit(value = undefined) {
    return {
        matches: (t) =>
            t.kind == "string" && (value ? t.value == value : true)
                ? t
                : undefined,
        toString: () => (value ? `"${value.toString()}"` : "<string>")
    }
}

/**
 * @template {string} S
 * @param {S} s
 * @returns {TokenMatcher<SymbolToken<S>>}
 */
export function symbol(s) {
    const check = makeSymbolToken(s)

    return {
        matches: (t) => (check.isEqual(t) ? check : undefined),
        toString: () => s
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
 * @param {object} options
 * @param {boolean} [options.caseInsensitive]
 * Defaults to false
 * @returns {TokenMatcher<Word>}
 */
export function word(s, options = {}) {
    return {
        matches: (t) =>
            t.kind == "word" &&
            (options?.caseInsensitive
                ? t.value.toLowerCase() == s.toLowerCase()
                : t.value == s)
                ? t
                : undefined,
        toString: () => s
    }
}
