import { TokenSite } from "./TokenSite.js"

/**
 * @template T
 * @typedef {import("@helios-lang/codec-utils").Option<T>} Option
 */

/**
 * @typedef {import("../errors/Site.js").Site} Site
 */

/**
 * @typedef {import("./Token.js").Token} Token
 */

/**
 * Symbol token represent anything non alphanumeric
 * @implements {Token}
 */
export class SymbolToken {
    /**
     * Writing is allowed as it is the easiest to change to an expected symbol in case of an error
     * @type {string}
     */
    value

    /**
     * @param {string} value
     * @param {Site} site
     */
    constructor(value, site = TokenSite.dummy()) {
        this.value = value
        this.site = site
    }

    /**
     * @param {Token | undefined} token
     * @returns {Option<SymbolToken>}
     */
    static asSymbol(token) {
        return token instanceof SymbolToken ? token : null
    }

    /**
     * @param {any} token
     * @param {Option<string | string[]>} value
     * @returns {token is SymbolToken}
     */
    static isSymbol(token, value = null) {
        if (token instanceof SymbolToken) {
            if (value) {
                return token.matches(value)
            } else {
                return true
            }
        } else {
            return false
        }
    }

    /**
     * @param {string | string[]} value
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

    /**
     * Finds the index of the first Symbol(value) in a list of tokens.
     * Returns -1 if none found.
     * @param {Token[]} ts
     * @param {string | string[]} value
     * @returns {number}
     */
    static find(ts, value) {
        return ts.findIndex((item) =>
            SymbolToken.asSymbol(item)?.matches(value)
        )
    }

    /**
     * Finds the index of the last Symbol(value) in a list of tokens.
     * Returns -1 if none found.
     * @param {Token[]} ts
     * @param {string | string[]} value
     * @returns {number}
     */
    static findLast(ts, value) {
        for (let i = ts.length - 1; i >= 0; i--) {
            if (SymbolToken.asSymbol(ts[i])?.matches(value)) {
                return i
            }
        }

        return -1
    }
}
