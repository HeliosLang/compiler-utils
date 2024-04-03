import { TokenSite } from "./TokenSite.js"

/**
 * @typedef {import("../errors/index.js").Site} Site
 * @typedef {import("./Token.js").Token} Token
 */

export const REAL_PRECISION = 6

const REAL_FACTOR = 10n ** BigInt(REAL_PRECISION)

/**
 * Fixed point number literal token
 * @implements {Token}
 */
export class RealLiteral {
    /**
     * Includes decimals
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
    constructor(value, site = TokenSite.dummy()) {
        this.value = value
        this.site = site
    }

    /**
     * @param {number} x
     * @returns {RealLiteral}
     */
    static fromNumber(x, site = TokenSite.dummy()) {
        const n = BigInt(Math.round(x * Number(REAL_FACTOR)))
        return new RealLiteral(n, site)
    }

    /**
     * @param {Token} other
     * @returns {boolean}
     */
    isEqual(other) {
        return other instanceof RealLiteral && other.value == this.value
    }

    /**
     * @returns {string}
     */
    toString() {
        let fraction = this.value % REAL_FACTOR
        if (fraction < 0n) {
            fraction = -fraction
        }

        let right = fraction.toString()

        // add largest zeroes
        while (right.length < REAL_PRECISION) {
            right = "0" + right
        }

        // trim smallest zeroes
        while (right.length >= 2 && right[right.length - 1] == "0") {
            right = right.slice(0, right.length - 1)
        }

        const left = (this.value / REAL_FACTOR).toString()

        let result = `${left}.${right}`

        if (this.value < 0n && !result.startsWith("-")) {
            result = "-" + result
        }

        return result
    }
}
