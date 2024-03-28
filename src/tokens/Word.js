import { None } from "@helios-lang/type-utils"
import { TokenSite } from "./TokenSite.js"

/**
 * @typedef {import("../errors/index.js").Site} Site
 * @typedef {import("./Token.js").Token} Token
 */

/**
 * A Word token represents a token that matches /[A-Za-z_][A-Za-z_0-9]/
 * @implements {Token}
 */
export class Word {
    /**
     * @readonly
     * @type {string}
     */
    value

    /**
     * @param {Site} site
     * @param {string} value
     */
    constructor(value, site = TokenSite.dummy()) {
        this.value = value
        this.site = site
    }

    /**
     * @param {Option<Token>} token
     * @returns {Option<Word>}
     */
    static from(token) {
        return token instanceof Word ? token : None
    }

    /**
     * @param {Token} other
     * @returns {boolean}
     */
    isEqual(other) {
        return other instanceof Word && other.value == this.value
    }

    /**
     * @returns {boolean}
     */
    isInternal() {
        return (
            this.value == "_" ||
            this.value.startsWith("__") ||
            this.value.endsWith("__")
        )
    }

    /**
     * @param {string | string[]} value
     * @returns {boolean}
     */
    matches(value) {
        if (value instanceof Array) {
            return value.lastIndexOf(this.value) != -1
        } else {
            return value == this.value
        }
    }

    /**
     * @returns {boolean}
     */
    isKeyword() {
        switch (this.value) {
            case "const":
            case "func":
            case "struct":
            case "enum":
            case "import":
            case "if":
            case "else":
            case "switch":
            case "self":
                return true
            default:
                return false
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.value
    }
}
