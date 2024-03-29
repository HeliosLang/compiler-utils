import { None } from "@helios-lang/type-utils"
import { SymbolToken } from "./SymbolToken.js"
import { Word } from "./Word.js"
import { Group } from "./Group.js"
import { IntLiteral } from "./IntLiteral.js"
import { StringLiteral } from "./StringLiteral.js"
import { ByteArrayLiteral } from "./ByteArrayLiteral.js"
import { bytesToHex, equalsBytes } from "@helios-lang/codec-utils"

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
 * @returns {TokenMatcher<Group>}
 */
export function group(kind) {
    return {
        matches: (t) => (t instanceof Group && t.isKind(kind) ? t : None),
        toString: () => `${kind}...${Group.otherSymbol(kind)}`
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
 * @param {boolean} caseInsensitive
 * @returns {TokenMatcher<Word>}
 */
export function word(s, caseInsensitive = false) {
    return {
        matches: (t) =>
            t instanceof Word &&
            (caseInsensitive
                ? t.value.toLowerCase() == s.toLowerCase()
                : t.value == s)
                ? t
                : None,
        toString: () => s
    }
}
