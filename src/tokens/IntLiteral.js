import { TokenSite } from "./TokenSite.js"

/**
 * @typedef {import("../errors/index.js").Site} Site
 * @typedef {import("./Token.js").Token} Token
 */

/**
 * Signed int literal token
 * @implements {Token}
 */
export class IntLiteral {
    /**
     * @readonly
     * @type {bigint}
     */
    value

    /**
     * @readonly
     * @type {Site}
     */
    site

    /**
     * @param {bigint} value
     * @param {Site} site
     */
    constructor(value, site = TokenSite.dummy()) {
        this.value = value
        this.site = site
    }

    /**
     * @param {Token} other
     * @returns {boolean}
     */
    isEqual(other) {
        return other instanceof IntLiteral && other.value == this.value
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.value.toString()
    }
}
