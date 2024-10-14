import { bytesToHex, equalsBytes } from "@helios-lang/codec-utils"
import { makeDummySite } from "./TokenSite.js"

/**
 * @typedef {import("../errors/index.js").Site} Site
 * @typedef {import("./Token.js").ByteArrayLiteral} ByteArrayLiteral
 * @typedef {import("./Token.js").Token} Token
 */

/**
 * @param {{
 *   value: number[]
 *   site?: Site
 * }} args
 * @returns {ByteArrayLiteral}
 */
export function makeByteArrayLiteral(args) {
    return new ByteArrayLiteralImpl(args.value, args.site ?? makeDummySite())
}

/**
 * ByteArray literal token
 * @implements {ByteArrayLiteral}
 */
class ByteArrayLiteralImpl {
    /**
     * @readonly
     * @type {number[]}
     */
    value

    /**
     * @readonly
     * @type {Site}
     */
    site

    /**
     * @param {number[]} value
     * @param {Site} site
     */
    constructor(value, site) {
        this.value = value
        this.site = site
    }

    /**
     * @type {"bytes"}
     */
    get kind() {
        return "bytes"
    }

    /**
     * @param {Token} other
     * @returns {boolean}
     */
    isEqual(other) {
        return other.kind == "bytes" && equalsBytes(this.value, other.value)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `#${bytesToHex(this.value)}`
    }
}
