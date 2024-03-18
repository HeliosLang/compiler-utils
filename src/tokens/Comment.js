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

    toString() {
        return this.value
    }
}
