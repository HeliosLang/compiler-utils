import { TokenSite } from "./TokenSite.js"

/**
 * @typedef {import("../errors/index.js").Site} Site
 * @typedef {import("./Token.js").BoolLiteralI} BoolLiteralI
 * @typedef {import("./Token.js").Token} Token
 */

/**
 * Bool literal token
 * @implements {BoolLiteralI}
 */
export class BoolLiteral {
    /**
     * @readonly
     * @type {boolean}
     */
    value

    /**
     * @readonly
     * @type {Site}
     */
    site

    /**
     * @param {boolean} value
     * @param {Site} site
     */
    constructor(value, site = TokenSite.dummy()) {
        this.value = value
        this.site = site
    }

    /**
     * @param {string} s
     * @param {TokenSite} site
     * @returns {BoolLiteral}
     */
    static fromString(s, site = TokenSite.dummy()) {
        return new BoolLiteral(s == "true", site)
    }

    /**
     * @type {"bool"}
     */
    get kind() {
        return "bool"
    }

    /**
     * @param {Token} other
     * @returns {boolean}
     */
    isEqual(other) {
        return other.kind == "bool" && other.value == this.value
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.value ? "true" : "false"
    }
}
