import { None } from "@helios-lang/type-utils"
import { SymbolToken } from "./SymbolToken.js"
import { Word } from "./Word.js"
import { Group } from "./Group.js"
import { IntLiteral } from "./IntLiteral.js"
import { StringLiteral } from "./StringLiteral.js"
import { ByteArrayLiteral } from "./ByteArrayLiteral.js"
import { bytesToHex, equalsBytes } from "@helios-lang/codec-utils"
import { BoolLiteral } from "./BoolLiteral.js"

/**
 * @typedef {import("./Token.js").Token} Token
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
    matches: (t) => (t instanceof SymbolToken ? t : None),
    toString: () => "<symbol>"
}

/**
 * @type {TokenMatcher<Word>}
 */
export const anyWord = {
    matches: (t) => (t instanceof Word ? t : None),
    toString: () => "<word>"
}

/**
 * @param {Option<boolean>} value
 * @returns {TokenMatcher<BoolLiteral>}
 */
export function boollit(value = None) {
    return {
        matches: (t) =>
            t instanceof BoolLiteral && (value ? t.value === value : true)
                ? t
                : None,
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
            t instanceof ByteArrayLiteral &&
            (value ? equalsBytes(t.value, value) : true)
                ? t
                : None,
        toString: () =>
            value ? `#${bytesToHex(Array.from(value))}` : "<bytes>"
    }
}

/**
 * @param {string} kind
 * @param {Option<{length: number} | {minLength: number} | {maxLength: number} | {minLength: number, maxLength: number }>} options
 * @returns {TokenMatcher<Group>}
 */
export function group(kind, options = None) {
    /**
     * @param {Group} g
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
            t instanceof Group && t.isKind(kind) && matchLength(t) ? t : None,
        toString: () =>
            `${kind}${options && "length" in options ? `<${options.length} entries>` : "..."}${Group.otherSymbol(kind)}`
    }
}

/**
 * @param {Option<string | number | bigint>} value
 * @returns {TokenMatcher<IntLiteral>}
 */
export function intlit(value = None) {
    return {
        matches: (t) =>
            t instanceof IntLiteral && (value ? t.value == BigInt(value) : true)
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
 * @param {Option<string>} value
 * @returns {TokenMatcher<StringLiteral>}
 */
export function strlit(value = None) {
    return {
        matches: (t) =>
            t instanceof StringLiteral && (value ? t.value == value : true)
                ? t
                : None,
        toString: () => (value ? `"${value.toString()}"` : "<string>")
    }
}

/**
 * @param {string} v
 * @returns {TokenMatcher<SymbolToken>}
 */
export function symbol(v) {
    const s = new SymbolToken(v)

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
            t instanceof Word &&
            (options?.caseInsensitive
                ? t.value.toLowerCase() == s.toLowerCase()
                : t.value == s)
                ? t
                : None,
        toString: () => s
    }
}
