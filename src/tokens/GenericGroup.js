import { expectDefined, isUndefined, isDefined } from "@helios-lang/type-utils"
import { makeSourceWriter } from "./SourceWriter.js"
import { makeSymbolToken } from "./SymbolToken.js"
import { makeDummySite, makeTokenSite } from "./TokenSite.js"

/**
 * @import { GenericGroup, GroupKind, GroupCloseKind, Site, SymbolToken, Token, TokenGroup, TokenReader } from "../index.js"
 */

/**
 * @satisfies {GroupKind[]}
 */
export const GROUP_OPEN_SYMBOLS = /** @type {const} */ (["(", "[", "{"])

/**
 * @satisfies {GroupCloseKind[]}
 */
export const GROUP_CLOSE_SYMBOLS = /** @type {const} */ ([")", "]", "}"])

/**
 * @template {Token[] | TokenReader} [F=Token[]]
 * @param {object} options
 * @param {GroupKind} options.kind
 * @param {F[]} options.fields
 * @param {SymbolToken[]} options.separators
 * @param {Site} [options.site]
 * @returns {GenericGroup<F>}
 */
export function makeGroup(options) {
    return new GenericGroupImpl(
        options.kind,
        options.fields,
        options.separators,
        options.site ?? makeDummySite()
    )
}

/**
 * Group token can '(...)', '[...]' or '{...}' and can contain comma separated fields.
 * @template {Token[] | TokenReader} [F=Token[]] - each field be either a list of tokens or a TokenReader
 * @implements {GenericGroup<F>}
 */
class GenericGroupImpl {
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
     * @type {SymbolToken[]}
     */
    separators

    /**
     * @readonly
     * @type {Site}
     */
    site

    /**
     * @readonly
     * @type {string | undefined}
     */
    error

    /**
     * @param {GroupKind} kind - "(", "[" or "{"
     * @param {F[]} fields
     * @param {SymbolToken[]} separators - useful for more accurate errors
     * @param {Site} site - end site must be supplied
     */
    constructor(kind, fields, separators, site) {
        const expectCount = Math.max(fields.length - 1, 0)
        this.error = undefined
        if (separators.length > expectCount) {
            const separatorType = separators[0].value
            this.error = `'${kind}' group: excess '${separatorType}' - expected ${expectCount}, got ${separators.length}`
        } else if (separators.length != expectCount) {
            throw new Error(`expected ${expectCount}, got ${separators.length}`)
        }

        expectDefined(
            site.end,
            "site end must be supplied (for closing group symbol)"
        )

        this.kind = kind
        this.fields = fields // list of lists of tokens
        this.separators = separators
        this.site = site
    }

    /**
     * @param {string | undefined} kind
     * @param {number | undefined} nFields
     * @returns {boolean}
     */
    isGroup(kind = undefined, nFields = undefined) {
        const nFieldsOk = isUndefined(nFields) || nFields == this.fields.length

        if (isDefined(kind)) {
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
            const w = makeSourceWriter({
                line: this.site.line,
                column: this.site.column
            })

            w.writeToken(makeSymbolToken(this.kind, this.site))

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
                makeSymbolToken(
                    getOtherGroupSymbol(this.kind),
                    makeTokenSite({
                        file: this.site.file,
                        startLine: expectDefined(
                            this.site.end?.line,
                            "site end line undefined"
                        ),
                        startColumn: expectDefined(
                            this.site.end?.column,
                            "site end column undefined"
                        )
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

            s += parts.join(", ") + getOtherGroupSymbol(this.kind)

            return s
        }
    }
}

/**
 * @param {Token} t
 * @returns {t is TokenGroup}
 */
export function isGroup(t) {
    return t.kind == "(" || t.kind == "{" || t.kind == "["
}

/**
 * @param {SymbolToken} t
 * @returns {t is SymbolToken<GroupKind>}
 */
export function isGroupOpenSymbol(t) {
    if (t.kind == "symbol") {
        return t.matches(GROUP_OPEN_SYMBOLS)
    } else {
        return false
    }
}

/**
 * @param {SymbolToken} t
 * @returns {t is SymbolToken<"]" | ")" | "}">}
 */
export function isGroupCloseSymbol(t) {
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
 * @param {string | SymbolToken} t
 * @returns {GroupKind | GroupCloseKind}
 */
export function getOtherGroupSymbol(t) {
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
