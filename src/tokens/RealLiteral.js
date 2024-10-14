import { makeDummySite } from "./TokenSite.js"

/**
 * @typedef {import("../errors/index.js").Site} Site
 * @typedef {import("./Token.js").RealLiteral} RealLiteral
 * @typedef {import("./Token.js").Token} Token
 */

export const REAL_PRECISION = 6

const REAL_FACTOR = 10n ** BigInt(REAL_PRECISION)

/**
 * @param {{
 *   value: bigint
 *   site?: Site
 * } | {
 *   number: number
 *   site?: Site
 * }} args
 * @returns {RealLiteral}
 */
export function makeRealLiteral(args) {
    if ("number" in args) {
        const n = BigInt(Math.round(args.number * Number(REAL_FACTOR)))
        return new RealLiteralImpl(n, args.site ?? makeDummySite())
    } else {
        return new RealLiteralImpl(args.value, args.site ?? makeDummySite())
    }
}

/**
 * Fixed point number literal token
 * @implements {RealLiteral}
 */
class RealLiteralImpl {
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
    constructor(value, site) {
        this.value = value
        this.site = site
    }

    /**
     * @type {"real"}
     */
    get kind() {
        return "real"
    }

    /**
     * @param {Token} other
     * @returns {boolean}
     */
    isEqual(other) {
        return other.kind == "real" && other.value == this.value
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
