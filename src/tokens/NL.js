/**
 * @import { NL, Site, Token } from "../index.js"
 */

/**
 * @param {Site} site
 * @returns {NL}
 */
export function makeNL(site) {
    return new NLImpl(site)
}

/**
 * @implements {NL}
 */
class NLImpl {
    /**
     * @readonly
     * @type {Site}
     */
    site

    /**
     * @param {Site} site
     */
    constructor(site) {
        this.site = site
    }

    /**
     * @type {"newline"}
     */
    get kind() {
        return "newline"
    }

    /**
     * @param {Token} other
     * @returns {boolean}
     */
    isEqual(other) {
        return other.kind == "newline"
    }

    /**
     * @returns {string}
     */
    toString() {
        return "\n"
    }
}
