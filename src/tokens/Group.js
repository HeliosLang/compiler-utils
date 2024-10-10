import { expectSome, isNone, isSome, None } from "@helios-lang/type-utils"
import { SourceWriter } from "./SourceWriter.js"
import { SymbolToken } from "./SymbolToken.js"
import { TokenSite } from "./TokenSite.js"
import { GROUP_OPEN_SYMBOLS, GROUP_CLOSE_SYMBOLS } from "./Token.js"

/**
 * @template {string} [T=string]
 * @typedef {import("./Token.js").SymbolTokenI<T>} SymbolTokenI
 */

/**
 * @typedef {import("../errors/index.js").Site} Site
 * @typedef {import("./Token.js").CommonGroupProps} CommonGroupProps
 * @typedef {import("./Token.js").GroupKind} GroupKind
 * @typedef {import("./Token.js").GroupCloseKind} GroupCloseKind
 * @typedef {import("./Token.js").Token} Token
 */

/**
 * @typedef {Token[] | {tokens: Token[]}} TokensLike
 */

/**
 * @template {TokensLike} [F=Token[]]
 * @typedef {CommonGroupProps & {
 *   fields: F[]
 * }} GenericGroupI
 */

/**
 * Group token can '(...)', '[...]' or '{...}' and can contain comma separated fields.
 * @template {TokensLike} [F=Token[]] - each field be either a list of tokens or a TokenReader
 * @implements {GenericGroupI<F>}
 */
export class Group {
    /**
     * "(", "[" or "{"
     * @readonly
     * @type {GroupKind}
     */
    kind

    /**
     * @readonly
     * @type {F[]}
     */
    fields

    /**
     * @readonly
     * @type {SymbolTokenI[]}
     */
    separators

    /**
     * @readonly
     * @type {Site}
     */
    site

    /**
     * @readonly
     * @type {string | null}
     */
    error

    /**
     * @param {GroupKind} kind - "(", "[" or "{"
     * @param {F[]} fields
     * @param {SymbolTokenI[]} separators - useful for more accurate errors
     * @param {Site} site - end site must be supplied
     */
    constructor(kind, fields, separators, site = TokenSite.dummy()) {
        const expectCount = Math.max(fields.length - 1, 0)
        this.error = null
        if (separators.length > expectCount) {
            const separatorType = separators[0].value
            this.error = `'${kind}' group: excess '${separatorType}' - expected ${expectCount}, got ${separators.length}`
        } else if (separators.length != expectCount) {
            throw new Error(`expected ${expectCount}, got ${separators.length}`)
        }

        expectSome(
            site.end,
            "site end must be supplied (for closing group symbol)"
        )

        this.kind = kind
        this.fields = fields // list of lists of tokens
        this.separators = separators
        this.site = site
    }

    /**
     * @param {Option<Token>} token
     * @returns {Option<Group<Token[]>>}
     */
    static from(token) {
        if (token instanceof Group) {
            return token
        } else if (
            isSome(token) &&
            (token.kind == "(" || token.kind == "[" || token.kind == "{")
        ) {
            return new Group(
                token.kind,
                token.fields,
                token.separators,
                token.site
            )
        }
        return token instanceof Group ? token : None
    }

    /**
     * @param {string} kind
     * @returns {boolean}
     */
    isKind(kind) {
        return this.kind == kind
    }

    /**
     * @param {Option<string>} kind
     * @param {Option<number>} nFields
     * @returns {boolean}
     */
    isGroup(kind = None, nFields = None) {
        const nFieldsOk = isNone(nFields) || nFields == this.fields.length

        if (isSome(kind)) {
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

                if (Array.isArray(f)) {
                    f.forEach((f) => w.writeToken(f))
                } else {
                    f.tokens.forEach((f) => w.writeToken(f))
                }

                if (i < this.fields.length - 1) {
                    w.writeToken(this.separators[i])
                }
            }

            w.writeToken(
                new SymbolToken(
                    Group.otherSymbol(this.kind),
                    new TokenSite({
                        file: this.site.file,
                        startLine: expectSome(this.site.end?.line),
                        startColumn: expectSome(this.site.end?.column)
                    })
                )
            )
            return w.finalize()
        } else {
            let s = this.kind

            const parts = []

            for (let f of this.fields) {
                if (Array.isArray(f)) {
                    parts.push(f.map((t) => t.toString(false)).join(" "))
                } else {
                    parts.push(f.tokens.map((t) => t.toString(false)).join(" "))
                }
            }

            s += parts.join(", ") + Group.otherSymbol(this.kind)

            return s
        }
    }

    /**
     * @param {SymbolTokenI} t
     * @returns {t is SymbolTokenI<GroupKind>}
     */
    static isOpenSymbol(t) {
        if (t.kind == "symbol") {
            return t.matches(GROUP_OPEN_SYMBOLS)
        } else {
            return false
        }
    }

    /**
     * @param {SymbolTokenI} t
     * @returns {t is SymbolTokenI<"]" | ")" | "}">}
     */
    static isCloseSymbol(t) {
        if (t.kind == "symbol") {
            return t.matches(GROUP_CLOSE_SYMBOLS)
        } else {
            return false
        }
    }

    /**
     * Returns the corresponding closing bracket, parenthesis or brace.
     * Throws an error if not a group symbol.
     * @example
     * Group.matchSymbol("(") == ")"
     * @param {string | SymbolTokenI} t
     * @returns {GroupKind | GroupCloseKind}
     */
    static otherSymbol(t) {
        if (typeof t != "string") {
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
