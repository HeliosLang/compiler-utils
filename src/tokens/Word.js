import { makeDummySite } from "./TokenSite.js"

/**
 * @typedef {import("../errors/index.js").Site} Site
 * @typedef {import("./Token.js").Token} Token
 * @typedef {import("./Token.js").Word} Word
 */

/**
 * @param {{value: string, site?: Site}} args
 * @returns {Word}
 */
export function makeWord(args) {
    return new WordImpl(args.value, args.site ?? makeDummySite())
}

/**
 * A Word token represents a token that matches /[A-Za-z_][A-Za-z_0-9]/
 * @implements {Word}
 */
class WordImpl {
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
     * @param {Site} site
     * @param {string} value
     */
    constructor(value, site) {
        this.value = value
        this.site = site
    }

    /**
     * @type {"word"}
     */
    get kind() {
        return "word"
    }

    /**
     * @param {Token} other
     * @returns {boolean}
     */
    isEqual(other) {
        return other.kind == "word" && other.value == this.value
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
