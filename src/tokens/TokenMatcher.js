import { None } from "@helios-lang/type-utils"
import { SymbolToken } from "./SymbolToken.js"
import { Word } from "./Word.js"
import { Group } from "./Group.js"

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
