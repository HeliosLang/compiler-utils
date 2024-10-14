import { makeDummySite } from "./TokenSite.js"

/**
 * @typedef {import("../errors/index.js").Site} Site
 * @typedef {import("./Token.js").IntLiteral} IntLiteral
 * @typedef {import("./Token.js").Token} Token
 */

/**
 * @param {{
 *   value: bigint
 *   site?: Site
 * }} args
 * @returns {IntLiteral}
 */
export function makeIntLiteral(args) {
    return new IntLiteralImpl(args.value, args.site ?? makeDummySite())
}

/**
 * Signed int literal token
 * @implements {IntLiteral}
 */
class IntLiteralImpl {
    /**
     * @readonly
     * @type {bigint}
     */
    value

    /**
     * @readonly
     * @type {Site}
     */
    site

    /**
     * @param {bigint} value
     * @param {Site} site
     */
    constructor(value, site) {
        this.value = value
        this.site = site
    }

    /**
     * @type {"int"}
     */
    get kind() {
        return "int"
    }

    /**
     * @param {Token} other
     * @returns {boolean}
     */
    isEqual(other) {
        return other.kind == "int" && other.value == this.value
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.value.toString()
    }
}
