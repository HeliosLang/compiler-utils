import { bytesToHex } from "@helios-lang/codec-utils"
import { TokenSite } from "./TokenSite.js"

/**
 * @typedef {import("../errors/index.js").Site} Site
 */

/**
 * @typedef {import("./Token.js").Token} Token
 */

/**
 * ByteArray literal token
 * @implements {Token}
 */
export class ByteArrayLiteral {
    /**
     * @readonly
     * @type {number[]}
     */
    bytes

    /**
     * @readonly
     * @type {Site}
     */
    site

    /**
     * @param {number[]} bytes
     * @param {Site} site
     */
    constructor(bytes, site = TokenSite.dummy()) {
        this.bytes = bytes
        this.site = site
    }

    toString() {
        return `#${bytesToHex(this.bytes)}`
    }
}
