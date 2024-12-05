/**
 * @import { Comment, Site, Token } from "../index.js"
 */

/**
 * @param {{
 *   value: string
 *   site: Site
 * }} args
 * @returns {Comment}
 */
export function makeComment(args) {
    return new CommentImpl(args.value, args.site)
}

/**
 * @implements {Comment}
 */
class CommentImpl {
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
