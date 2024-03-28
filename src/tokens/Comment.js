import { None } from "@helios-lang/type-utils"

/**
 * @typedef {import("../errors/index.js").Site} Site
 * @typedef {import("./Token.js").Token} Token
 */

/**
 * @implements {Token}
 */
export class Comment {
    /**
     * @param {string} value - includes the comment symbols
     * @param {Site} site
     */
    constructor(value, site) {
        this.value = value
        this.site = site
    }

    /**
     * @param {any} token
     * @returns {Option<Comment>}
     */
    static from(token) {
        return token instanceof Comment ? token : None
    }

    /**
     * @param {Token} other
     * @returns {boolean}
     */
    isEqual(other) {
        return other instanceof Comment && other.value == this.value
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.value
    }
}
