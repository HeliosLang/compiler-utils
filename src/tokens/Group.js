import { SourceWriter } from "./SourceWriter.js"
import { SymbolToken } from "./SymbolToken.js"
import { TokenSite } from "./TokenSite.js"

/**
 * @template T
 * @typedef {import("@helios-lang/codec-utils").Option<T>} Option
 */

/**
 * @typedef {import("../errors/index.js").Site} Site
 */

/**
 * @typedef {import("./Token.js").Token} Token
 */

/**
 * Group token can '(...)', '[...]' or '{...}' and can contain comma separated fields.
 * @implements {Token}
 */
export class Group {
    /**
     * "(", "[" or "{"
     * @readonly
     * @type {string}
     */
    kind

    /**
     * @readonly
     * @type {Token[][]}
     */
    fields

    /**
     * @readonly
     * @type {SymbolToken[]}
     */
    separators

    /**
     * TokenSite instead of Token because we need position information of the closing symbol for accurate formatting purposes
     * @readonly
     * @type {TokenSite}
     */
    site

    /**
	 
	 * @param {string} kind - "(", "[" or "{"
	 * @param {Token[][]} fields 
     * @param {SymbolToken[]} separators - useful for more accurate errors
     * @param {TokenSite} site 
	 */
    constructor(kind, fields, separators, site = TokenSite.dummy()) {
        if (separators.length != Math.max(fields.length - 1, 0)) {
            throw new Error(
                `expected ${Math.max(fields.length - 1, 0)}, got ${separators.length}`
            )
        }

        this.kind = kind
        this.fields = fields // list of lists of tokens
        this.separators = separators
        this.site = site
    }

    /**
     * @param {any} token
     * @returns {Option<Group>}
     */
    static from(token) {
        return token instanceof Group ? token : null
    }

    /**
     * @param {string} kind
     * @returns {boolean}
     */
    isKind(kind) {
        return this.kind == kind
    }

    /**
     * @param {?string} kind
     * @param {number | null} nFields
     * @returns {boolean}
     */
    isGroup(kind = null, nFields = null) {
        const nFieldsOk = nFields === null || nFields == this.fields.length

        if (kind !== null) {
            return this.kind == kind && nFieldsOk
        } else {
            return nFieldsOk
        }
    }

    /**
     * @param {boolean} preserveWhitespace
     * @returns {string}
     */
    toString(preserveWhitespace = false) {
        if (preserveWhitespace) {
            const w = new SourceWriter({
                line: this.site.line,
                column: this.site.column
            })

            w.writeToken(new SymbolToken(this.kind, this.site))

            for (let i = 0; i < this.fields.length; i++) {
                const f = this.fields[i]

                this.fields[i].forEach((f) => w.writeToken(f))

                if (i < this.fields.length - 1) {
                    w.writeToken(this.separators[i])
                }
            }

            w.writeToken(
                new SymbolToken(
                    Group.otherSymbol(this.kind),
                    new TokenSite(
                        this.site.file,
                        this.site.endLine,
                        this.site.endColumn
                    )
                )
            )
            return w.finalize()
        } else {
            let s = this.kind

            const parts = []

            for (let f of this.fields) {
                parts.push(f.map((t) => t.toString(false)).join(" "))
            }

            s += parts.join(", ") + Group.otherSymbol(this.kind)

            return s
        }
    }

    /**
     * @param {Token} t
     * @returns {t is SymbolToken}
     */
    static isOpenSymbol(t) {
        if (SymbolToken.isSymbol(t)) {
            return t.matches(["{", "[", "("])
        } else {
            return false
        }
    }

    /**
     * @param {Token} t
     * @returns {t is SymbolToken}
     */
    static isCloseSymbol(t) {
        if (SymbolToken.isSymbol(t)) {
            return t.matches(["}", "]", ")"])
        } else {
            return false
        }
    }

    /**
     * Returns the corresponding closing bracket, parenthesis or brace.
     * Throws an error if not a group symbol.
     * @example
     * Group.matchSymbol("(") == ")"
     * @param {string | SymbolToken} t
     * @returns {string}
     */
    static otherSymbol(t) {
        if (SymbolToken.isSymbol(t)) {
            t = t.value
        }

        if (t == "{") {
            return "}"
        } else if (t == "[") {
            return "]"
        } else if (t == "(") {
            return ")"
        } else if (t == "}") {
            return "{"
        } else if (t == "]") {
            return "["
        } else if (t == ")") {
            return "("
        } else {
            throw new Error("not a group symbol")
        }
    }

    /**
     * Finds the index of first Group(type) in list of tokens
     * Returns -1 if none found.
     * @param {Token[]} ts
     * @param {string} kind
     * @returns {number}
     */
    static find(ts, kind) {
        return ts.findIndex((item) => Group.from(item)?.isKind(kind))
    }
}
