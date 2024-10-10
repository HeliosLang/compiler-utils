import { isSome, None } from "@helios-lang/type-utils"
import { TokenSite } from "./TokenSite.js"

/**
 * @typedef {import("../errors/index.js").Site} Site
 * @typedef {import("./Token.js").StringLiteralI} StringLiteralI
 * @typedef {import("./Token.js").Token} Token
 */

/**
 * String literal token (utf8)
 * @implements {StringLiteralI}
 */
export class StringLiteral {
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
    constructor(value, site = TokenSite.dummy()) {
        this.value = value
        this.site = site
    }

    /**
     * @param {Option<Token>} token
     * @returns {Option<StringLiteral>}
     */
    static from(token) {
        if (token instanceof StringLiteral) {
            return token
        } else if (isSome(token) && token.kind == "string") {
            return new StringLiteral(token.value, token.site)
        } else {
            return None
        }
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
