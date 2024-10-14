import { expectSome, isNone, isSome, None } from "@helios-lang/type-utils"
import { makeSourceWriter } from "./SourceWriter.js"
import { makeSymbolToken } from "./SymbolToken.js"
import { makeDummySite, makeTokenSite } from "./TokenSite.js"
import { GROUP_OPEN_SYMBOLS, GROUP_CLOSE_SYMBOLS } from "./Token.js"

/**
 * @template {string} [T=string]
 * @typedef {import("./Token.js").SymbolToken<T>} SymbolToken
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
 * }} GenericGroup
 */

/**
 * @template {TokensLike} [F=Token[]]
 * @param {{
 *   kind: GroupKind
 *   fields: F[]
 *   separators: SymbolToken[]
 *   site?: Site
 * }} args
 * @returns {GenericGroup<F>}
 */
export function makeGroup(args) {
    return new GenericGroupImpl(
        args.kind,
        args.fields,
        args.separators,
        args.site ?? makeDummySite()
    )
}

/**
 * Group token can '(...)', '[...]' or '{...}' and can contain comma separated fields.
 * @template {TokensLike} [F=Token[]] - each field be either a list of tokens or a TokenReader
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
     * @type {string | null}
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
            const w = makeSourceWriter({
                line: this.site.line,
                column: this.site.column
            })

            w.writeToken(makeSymbolToken({ value: this.kind, site: this.site }))

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
                makeSymbolToken({
                    value: getOtherGroupSymbol(this.kind),
                    site: makeTokenSite({
                        file: this.site.file,
                        startLine: expectSome(this.site.end?.line),
                        startColumn: expectSome(this.site.end?.column)
                    })
                })
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
