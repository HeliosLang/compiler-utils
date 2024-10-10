import { bytesToHex, equalsBytes } from "@helios-lang/codec-utils"
import { TokenSite } from "./TokenSite.js"

/**
 * @typedef {import("../errors/index.js").Site} Site
 * @typedef {import("./Token.js").ByteArrayLiteralI} ByteArrayLiteralI
 * @typedef {import("./Token.js").Token} Token
 */

/**
 * ByteArray literal token
 * @implements {ByteArrayLiteralI}
 */
export class ByteArrayLiteral {
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
    constructor(value, site = TokenSite.dummy()) {
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
