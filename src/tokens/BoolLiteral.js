import { makeDummySite } from "./TokenSite.js"

/**
 * @import { BoolLiteral, Site, Token } from "../index.js"
 */

/**
 * @param {{
 *   value: boolean | string
 *   site?: Site
 * }} args
 * @returns {BoolLiteral}
 */
export function makeBoolLiteral(args) {
    const value =
        typeof args.value == "string" ? args.value == "true" : args.value

    return new BoolLiteralImpl(value, args.site ?? makeDummySite())
}

/**
 * Bool literal token
 * @implements {BoolLiteral}
 */
class BoolLiteralImpl {
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
    constructor(value, site) {
        this.value = value
        this.site = site
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
