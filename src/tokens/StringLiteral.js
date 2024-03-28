import { None } from "@helios-lang/type-utils"
import { TokenSite } from "./TokenSite.js"

/**
 * @typedef {import("../errors/index.js").Site} Site
 * @typedef {import("./Token.js").Token} Token
 */

/**
 * String literal token (utf8)
 * @implements {Token}
 */
export class StringLiteral {
    /**
     * @readonly
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
     *
     * @param {any} token
     * @returns {Option<StringLiteral>}
     */
    static from(token) {
        return token instanceof StringLiteral ? token : None
    }

    /**
     * @param {Token} other
     * @returns {boolean}
     */
    isEqual(other) {
        return other instanceof StringLiteral && other.value == this.value
    }

    /**
     * @returns {string}
     */
    toString() {
        return `"${this.value.toString()}"`
    }
}
