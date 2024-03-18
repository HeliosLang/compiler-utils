import { None } from "@helios-lang/codec-utils"
import { TokenSite } from "./TokenSite.js"

/**
 * @template T
 * @typedef {import("@helios-lang/codec-utils").Option<T>} Option
 */

/**
 * @typedef {import("../errors/index.js").Site} Site
 */

/**
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

    toString() {
        return `"${this.value.toString()}"`
    }
}
