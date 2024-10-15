import { makeDummySite } from "./TokenSite.js"

/**
 * @import { Site, StringLiteral, Token } from "src/index.js"
 */

/**
 * @param {{
 *   value: string
 *   site?: Site
 * }} args
 * @returns {StringLiteral}
 */
export function makeStringLiteral(args) {
    return new StringLiteralImpl(args.value, args.site ?? makeDummySite())
}

/**
 * String literal token (utf8)
 * @implements {StringLiteral}
 */
class StringLiteralImpl {
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
     * @param {string} value
     * @param {Site} site
     */
    constructor(value, site) {
        this.value = value
        this.site = site
    }

    /**
     * @type {"string"}
     */
    get kind() {
        return "string"
    }

    /**
     * @param {Token} other
     * @returns {boolean}
     */
    isEqual(other) {
        return other.kind == "string" && other.value == this.value
    }

    /**
     * @returns {string}
     */
    toString() {
        return `"${this.value.toString()}"`
    }
}
