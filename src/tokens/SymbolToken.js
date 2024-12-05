import { makeDummySite } from "./TokenSite.js"

/**
 * @import { Site, SymbolToken, Token } from "../index.js"
 */

/**
 * @template {string} [T=string]
 * @param {T} value
 * @param {Site} site
 * Defaults to dummy site
 *
 * @returns {SymbolToken<T>}
 */
export function makeSymbolToken(value, site = makeDummySite()) {
    return new SymbolTokenImpl(value, site)
}

/**
 * Symbol token represent anything non alphanumeric
 * @template {string} [T=string]
 * @implements {SymbolToken<T>}
 */
class SymbolTokenImpl {
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
    constructor(value, site) {
        this.value = value
        this.site = site
    }

    /**
     * @type {"symbol"}
     */
    get kind() {
        return "symbol"
    }

    /**
     * @param {Token} other
     * @returns {other is SymbolToken<T>}
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
