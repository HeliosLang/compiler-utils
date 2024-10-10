import { isSome, None } from "@helios-lang/type-utils"
import { TokenSite } from "./TokenSite.js"

/**
 * @template {string} [T=string]
 * @typedef {import("./Token.js").SymbolTokenI<T>} SymbolTokenI
 */

/**
 * @typedef {import("../errors/Site.js").Site} Site
 * @typedef {import("./Token.js").Token} Token
 */

/**
 * Symbol token represent anything non alphanumeric
 * @template {string} [T=string]
 * @implements {SymbolTokenI<T>}
 */
export class SymbolToken {
    /**
     * Writing is allowed as it is the easiest to change to an expected symbol in case of an error
     * @type {T}
     */
    value

    /**
     * @readonly
     * @type {Site}
     */
    site

    /**
     * @param {T} value
     * @param {Site} site
     */
    constructor(value, site = TokenSite.dummy()) {
        this.value = value
        this.site = site
    }

    /**
     * @param {Option<Token>} token
     * @returns {Option<SymbolToken>}
     */
    static from(token) {
        if (token instanceof SymbolToken) {
            return token
        } else if (isSome(token) && token.kind == "symbol") {
            return new SymbolToken(token.value, token.site)
        } else {
            return None
        }
    }

    /**
     * Finds the index of the first Symbol(value) in a list of tokens.
     * Returns -1 if none found.
     * @param {Token[]} ts
     * @param {string | ReadonlyArray<string>} value
     * @returns {number}
     */
    static find(ts, value) {
        return ts.findIndex((item) => SymbolToken.from(item)?.matches(value))
    }

    /**
     * Finds the index of the last Symbol(value) in a list of tokens.
     * Returns -1 if none found.
     * @param {Token[]} ts
     * @param {string | ReadonlyArray<string>} value
     * @returns {number}
     */
    static findLast(ts, value) {
        for (let i = ts.length - 1; i >= 0; i--) {
            if (SymbolToken.from(ts[i])?.matches(value)) {
                return i
            }
        }

        return -1
    }

    /**
     * @type {"symbol"}
     */
    get kind() {
        return "symbol"
    }

    /**
     * @param {Token} other
     * @returns {boolean}
     */
    isEqual(other) {
        return other.kind == "symbol" && other.value == this.value
    }

    /**
     * @param {string | ReadonlyArray<string>} value
     * @returns {boolean}
     */
    matches(value) {
        if (value instanceof Array) {
            return value.lastIndexOf(this.value) != -1
        } else {
            return value == this.value
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.value
    }
}
