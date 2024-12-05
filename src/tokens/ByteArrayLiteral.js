import { bytesToHex, equalsBytes, toBytes } from "@helios-lang/codec-utils"
import { makeDummySite } from "./TokenSite.js"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { ByteArrayLiteral, Site, Token } from "../index.js"
 */

/**
 * @param {BytesLike} bytes
 * Anything that can be converted to `number[]`
 *
 * @param {Site} site
 * Defaults to a dummy site
 *
 * @returns {ByteArrayLiteral}
 */
export function makeByteArrayLiteral(bytes, site = makeDummySite()) {
    return new ByteArrayLiteralImpl(toBytes(bytes), site)
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
