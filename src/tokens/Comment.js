import { None } from "@helios-lang/type-utils"

/**
 * @typedef {import("../errors/index.js").Site} Site
 * @typedef {import("./Token.js").CommentI} CommentI
 * @typedef {import("./Token.js").Token} Token
 */

/**
 * @implements {CommentI}
 */
export class Comment {
    /**
     * @readonly
     * @type {string}
     */
    value

    /**
     * @readonly
     * @type {Site}
     */
    site

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
     * @type {"comment"}
     */
    get kind() {
        return "comment"
    }

    /**
     * @param {Token} other
     * @returns {boolean}
     */
    isEqual(other) {
        return other.kind == "comment" && other.value == this.value
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.value
    }
}
