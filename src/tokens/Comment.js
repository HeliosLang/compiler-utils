import { None } from "@helios-lang/codec-utils"

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

    toString() {
        return this.value
    }
}
