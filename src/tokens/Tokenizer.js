import { encodeUtf8, hexToBytes } from "@helios-lang/codec-utils"
import { isSome } from "@helios-lang/type-utils"
import { makeErrorCollector } from "../errors/index.js"
import { makeBoolLiteral } from "./BoolLiteral.js"
import { makeByteArrayLiteral } from "./ByteArrayLiteral.js"
import { makeComment } from "./Comment.js"
import {
    getOtherGroupSymbol,
    isGroupCloseSymbol,
    isGroupOpenSymbol,
    makeGroup
} from "./GenericGroup.js"
import { makeIntLiteral } from "./IntLiteral.js"
import { REAL_PRECISION, makeRealLiteral } from "./RealLiteral.js"
import { makeSourceIndex } from "./SourceIndex.js"
import { makeStringLiteral } from "./StringLiteral.js"
import { makeSymbolToken } from "./SymbolToken.js"
import { isDummySite, makeTokenSite } from "./TokenSite.js"
import { makeWord } from "./Word.js"

/**
 * @template {string} [T=string]
 * @typedef {import("./Token.js").SymbolToken<T>} SymbolToken
 */

/**
 * @typedef {import("../errors/index.js").ErrorCollector} ErrorCollector
 * @typedef {import("../errors/index.js").Site} Site
 * @typedef {import("./Source.js").Source} Source
 * @typedef {import("./SourceIndex.js").SourceIndex} SourceIndex
 * @typedef {import("./SourceMap.js").SourceMap} SourceMap
 * @typedef {import("./Token.js").GroupKind} GroupKind
 * @typedef {import("./Token.js").Token} Token
 * @typedef {import("./Token.js").TokenGroup} TokenGroup
 */

/**
 * @typedef {{
 *   sourceMap?: SourceMap
 *   extraValidFirstLetters?: string
 *   realPrecision?: number
 *   tokenizeReal?: boolean
 *   preserveComments?: boolean
 *   allowLeadingZeroes?: boolean
 *   errorCollector?: ErrorCollector
 * }} TokenizerOptions
 */

const DEFAULT_VALID_FIRST_LETTERS =
    "_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

/**
 * @typedef {{
 *   readonly errors: ErrorCollector
 *   tokenize(nestGroups?: boolean): Token[]
 *   stream(): Generator<Token>
 * }} Tokenizer
 */

/**
 * @param {{source: Source, options?: TokenizerOptions}} args
 * @returns {Tokenizer}
 */
export function makeTokenizer(args) {
    return new TokenizerImpl(args.source, args.options ?? {})
}

/**
 * @implements {Tokenizer}
 */
class TokenizerImpl {
    /**
     * @private
     * @readonly
     * @type {number}
     */
    _realPrecision

    /**
     * @private
     * @readonly
     * @type {boolean}
     */
    _tokenizeReal

    /**
     * @private
     * @readonly
     * @type {boolean}
     */
    _preserveComments

    /**
     * @private
     * @readonly
     * @type {boolean}
     */
    _allowLeadingZeroes

    /**
     * Basic syntax errors are accumulated here
     * @readonly
     * @type {ErrorCollector}
     */
    errors

    /**
     * @private
     * @readonly
     * @type {Set<string>}
     */
    _validFirstLetters

    /**
     * Current character index
     * @private
     * @type {SourceIndex}
     */
    _sourceIndex

    /**
     * Tokens are accumulated in this list
     * @private
     * @type {Token[]}
     */
    _tokens

    /**
     * @param {Source} source
     * @param {TokenizerOptions} options
     */
    constructor(source, options = {}) {
        this._realPrecision = options?.realPrecision ?? REAL_PRECISION
        this._tokenizeReal = options?.tokenizeReal ?? true
        this._preserveComments = options?.preserveComments ?? false
        this._allowLeadingZeroes = options?.allowLeadingZeroes ?? false
        this.errors = options.errorCollector ?? makeErrorCollector()

        this._validFirstLetters = new Set(
            (
                DEFAULT_VALID_FIRST_LETTERS +
                (options?.extraValidFirstLetters ?? "")
            ).split("")
        )
        this._sourceIndex = makeSourceIndex({
            source,
            sourceMap: options.sourceMap
        })
        this._tokens = [] // reset to empty to list at start of tokenize()
    }

    /**
     * Tokenize the complete source.
     * @param {boolean} nestGroups - Nest groups before returning a list of tokens
     * @returns {Token[]}
     */
    tokenize(nestGroups = true) {
        this._tokens = []

        let site = this.currentSite
        let c = this.readChar()

        while (c != "\0") {
            this.readToken(site, c)

            site = this.currentSite
            c = this.readChar()
        }

        if (nestGroups) {
            return this.nestGroups(this._tokens)
        } else {
            return this._tokens
        }
    }

    /**
     * Returns a generator
     * Use gen.next().value to access to the next Token
     * Doesn't perform any grouping
     * Used for quickly parsing the ScriptPurpose header of a script
     * @returns {Generator<Token>}
     */
    *stream() {
        this._tokens = []

        let site = this.currentSite
        let c = this.readChar()

        while (c != "\0") {
            this.readToken(site, c)

            let t = this._tokens.shift()
            while (t != undefined) {
                yield t
                t = this._tokens.shift()
            }

            site = this.currentSite
            c = this.readChar()
        }

        if (this._tokens.length != 0) {
            throw new Error("unexpected")
        }
    }

    /**
     * @private
     * @type {Site}
     */
    get currentSite() {
        return this._sourceIndex.site
    }

    /**
     * @private
     * @param {Site} start
     * @returns {Site}
     */
    rangeSite(start) {
        const end = this.currentSite

        if (isDummySite(end)) {
            return start
        } else {
            return makeTokenSite({
                file: start.file,
                startLine: start.line,
                startColumn: start.column,
                endLine: end.line,
                endColumn: end.column,
                alias: start.alias
            })
        }
    }

    /**
     * @private
     * @param {Site} site
     * @param {string} msg
     */
    addSyntaxError(site, msg) {
        this.errors.syntax(site, msg)
    }

    /**
     * @private
     * @param {Token} t
     */
    pushToken(t) {
        this._tokens.push(t)
    }

    /**
     * Reads a single char from the source and advances _pos by one
     * @private
     * @returns {string}
     */
    readChar() {
        return this._sourceIndex.readChar()
    }

    /**
     * @private
     * @returns {string}
     */
    peekChar() {
        return this._sourceIndex.peekChar()
    }

    /**
     * Decreases source index pos by one
     * @private
     */
    unreadChar() {
        this._sourceIndex.unreadChar()
    }

    /**
     * Start reading precisely one token
     * @private
     * @param {Site} site
     * @param {string} c
     */
    readToken(site, c) {
        if (c == "b") {
            this.readMaybeUtf8ByteArray(site)
        } else if (this._validFirstLetters.has(c)) {
            this.readWord(site, c)
        } else if (c == "/") {
            this.readMaybeComment(site)
        } else if (c == "0") {
            this.readSpecialInteger(site)
        } else if (c >= "1" && c <= "9") {
            this.readDecimal(site, c)
        } else if (c == "#") {
            this.readByteArray(site)
        } else if (c == '"') {
            this.readString(site)
        } else if (
            c == "?" ||
            c == "!" ||
            c == "%" ||
            c == "&" ||
            (c >= "(" && c <= ".") ||
            (c >= ":" && c <= ">") ||
            c == "[" ||
            c == "]" ||
            (c >= "{" && c <= "}")
        ) {
            this.readSymbol(site, c)
        } else if (!(c == " " || c == "\n" || c == "\t" || c == "\r")) {
            this.addSyntaxError(
                site,
                `invalid source character '${c}' (utf-8 not yet supported outside string literals)`
            )
        }
    }

    /**
     * Reads one word token.
     * Immediately turns "true" or "false" into a BoolLiteral instead of keeping it as Word
     * @private
     * @param {Site} site
     * @param {string} c0 - first character
     */
    readWord(site, c0) {
        let chars = []

        let c = c0
        while (c != "\0") {
            if ((c >= "0" && c <= "9") || this._validFirstLetters.has(c)) {
                chars.push(c)
                c = this.readChar()
            } else {
                this.unreadChar()
                break
            }
        }

        let value = chars.join("")

        const wordSite = this.rangeSite(site)

        if (value == "true" || value == "false") {
            this.pushToken(makeBoolLiteral({ value, site: wordSite }))
        } else {
            this.pushToken(makeWord({ value, site: wordSite }))
        }
    }

    /**
     * Reads and discards a comment if current '/' char is followed by '/' or '*'.
     * Otherwise pushes Symbol('/') onto _tokens
     * @private
     * @param {Site} site
     */
    // comments are discarded
    readMaybeComment(site) {
        let c = this.readChar()

        if (c == "\0") {
            this.pushToken(makeSymbolToken({ value: "/", site }))
        } else if (c == "/") {
            this.readSingleLineComment(site)
        } else if (c == "*") {
            this.readMultiLineComment(site)
        } else {
            this.pushToken(makeSymbolToken({ value: "/", site }))
            this.unreadChar()
        }
    }

    /**
     * Reads and discards a single line comment (from '//' to end-of-line)
     * @private
     * @param {Site} site
     */
    readSingleLineComment(site) {
        let c = this.readChar()
        const chars = ["/", "/", c]

        while (c != "\n" && c != "\0") {
            c = this.readChar()
            chars.push(c)
        }

        if (this._preserveComments) {
            this.pushToken(
                makeComment({
                    value: chars.join(""),
                    site: this.rangeSite(site)
                })
            )
        }
    }

    /**
     * Reads and discards a multi-line comment (from '/' '*' to '*' '/')
     * @private
     * @param {Site} site
     */
    readMultiLineComment(site) {
        let prev = ""
        let c = this.readChar()
        const chars = ["/", "*", c]

        while (true) {
            prev = c
            c = this.readChar()
            chars.push(c)

            if (c == "/" && prev == "*") {
                break
            } else if (c == "\0") {
                this.addSyntaxError(
                    this.rangeSite(site),
                    "unterminated multiline comment"
                )
                return
            }
        }

        if (this._preserveComments) {
            this.pushToken(
                makeComment({
                    value: chars.join(""),
                    site: this.rangeSite(site)
                })
            )
        }
    }

    /**
     * Reads a literal integer
     * @private
     * @param {Site} site
     */
    readSpecialInteger(site) {
        let c = this.readChar()

        if (c == "\0") {
            this.pushToken(makeIntLiteral({ value: 0n, site }))
        } else if (c == "b") {
            this.readBinaryInteger(site)
        } else if (c == "o") {
            this.readOctalInteger(site)
        } else if (c == "x") {
            this.readHexInteger(site)
        } else if ((c >= "A" && c <= "Z") || (c >= "a" && c <= "z")) {
            this.addSyntaxError(site, `bad literal integer type 0${c}`)
        } else if (c >= "0" && c <= "9") {
            if (this._allowLeadingZeroes) {
                this.readDecimal(site, c)
            } else {
                this.addSyntaxError(site, "unexpected leading 0")
            }
        } else if (c == "." && this._tokenizeReal) {
            this.readFixedPoint(site, ["0"])
        } else {
            this.pushToken(makeIntLiteral({ value: 0n, site }))
            this.unreadChar()
        }
    }

    /**
     * @private
     * @param {Site} site
     */
    readBinaryInteger(site) {
        this.readRadixInteger(site, "0b", (c) => c == "0" || c == "1")
    }

    /**
     * @private
     * @param {Site} site
     */
    readOctalInteger(site) {
        this.readRadixInteger(site, "0o", (c) => c >= "0" && c <= "7")
    }

    /**
     * @private
     * @param {Site} site
     */
    readHexInteger(site) {
        this.readRadixInteger(
            site,
            "0x",
            (c) => (c >= "0" && c <= "9") || (c >= "a" && c <= "f")
        )
    }

    /**
     * @private
     * @param {Site} site
     * @param {string[]} chars
     * @param {boolean} reverse
     * @returns {string[]}
     */
    assertCorrectDecimalUnderscores(site, chars, reverse = false) {
        if (chars.some((c) => c == "_")) {
            for (let i = 0; i < chars.length; i++) {
                const c = reverse ? chars[chars.length - 1 - i] : chars[i]

                if (i == chars.length - 1) {
                    if (c == "_") {
                        this.addSyntaxError(
                            site,
                            "redundant decimal underscore"
                        )
                    }
                }

                if ((i + 1) % 4 == 0) {
                    if (c != "_") {
                        this.addSyntaxError(site, "bad decimal underscore")
                    }
                } else {
                    if (c == "_") {
                        this.addSyntaxError(site, "bad decimal underscore")
                    }
                }
            }

            return chars.filter((c) => c != "_")
        } else {
            return chars
        }
    }

    /**
     * @private
     * @param {Site} site
     * @param {string} c0 - first character
     */
    readDecimal(site, c0) {
        /**
         * @type {string[]}
         */
        let chars = []

        let c = c0
        while (c != "\0") {
            if ((c >= "0" && c <= "9") || c == "_") {
                chars.push(c)
            } else {
                if (
                    (c >= "0" && c <= "9") ||
                    (c >= "A" && c <= "Z") ||
                    (c >= "a" && c <= "z")
                ) {
                    this.addSyntaxError(
                        this.rangeSite(site),
                        "invalid syntax for decimal integer literal"
                    )
                } else if (c == "." && this._tokenizeReal) {
                    const cf = this.peekChar()

                    if (cf >= "0" && cf <= "9") {
                        this.readFixedPoint(site, chars)

                        return
                    }
                }

                this.unreadChar()
                break
            }

            c = this.readChar()
        }

        const intSite = this.rangeSite(site)
        chars = this.assertCorrectDecimalUnderscores(intSite, chars, true)

        this.pushToken(
            makeIntLiteral({
                value: BigInt(chars.filter((c) => c != "_").join("")),
                site: intSite
            })
        )
    }

    /**
     * @private
     * @param {Site} site
     * @param {string} prefix
     * @param {(c: string) => boolean} valid - checks if character is valid as part of the radix
     */
    readRadixInteger(site, prefix, valid) {
        let c = this.readChar()

        let chars = []

        if (!valid(c)) {
            this.addSyntaxError(
                this.rangeSite(site),
                `expected at least one char for ${prefix} integer literal`
            )
            this.unreadChar()
            return
        }

        while (c != "\0") {
            if (valid(c)) {
                chars.push(c)
            } else {
                if (
                    (c >= "0" && c <= "9") ||
                    (c >= "A" && c <= "Z") ||
                    (c >= "a" && c <= "z")
                ) {
                    this.addSyntaxError(
                        this.rangeSite(site),
                        `invalid syntax for ${prefix} integer literal`
                    )
                }

                this.unreadChar()
                break
            }

            c = this.readChar()
        }

        this.pushToken(
            makeIntLiteral({
                value: BigInt(prefix + chars.join("")),
                site: this.rangeSite(site)
            })
        )
    }

    /**
     * @private
     * @param {Site} site
     * @param {string[]} leading
     */
    readFixedPoint(site, leading) {
        /**
         * @type {string[]}
         */
        let trailing = []

        let c = this.readChar()

        while (c != "\0") {
            if ((c >= "0" && c <= "9") || c == "_") {
                trailing.push(c)
            } else {
                this.unreadChar()
                break
            }

            c = this.readChar()
        }

        const tokenSite = this.rangeSite(site)

        leading = this.assertCorrectDecimalUnderscores(tokenSite, leading, true)

        trailing = this.assertCorrectDecimalUnderscores(
            tokenSite,
            trailing,
            false
        )

        if (trailing.length > this._realPrecision) {
            this.addSyntaxError(
                tokenSite,
                `literal real decimal places overflow (max ${this._realPrecision} supported, but ${trailing.length} specified)`
            )
            trailing.splice(this._realPrecision)
        }

        while (trailing.length < this._realPrecision) {
            trailing.push("0")
        }

        this.pushToken(
            makeRealLiteral({
                value: BigInt(leading.concat(trailing).join("")),
                site: tokenSite
            })
        )
    }

    /**
     * Reads literal hexadecimal representation of ByteArray
     * @private
     * @param {Site} site
     */
    readByteArray(site) {
        let c = this.readChar()

        let chars = []

        // case doesn't matter
        while (
            (c >= "a" && c <= "f") ||
            (c >= "A" && c <= "F") ||
            (c >= "0" && c <= "9")
        ) {
            chars.push(c)
            c = this.readChar()
        }

        // empty byteArray is allowed (eg. for Ada mintingPolicyHash)

        // last char is the one that made the while loop break, so should be unread
        this.unreadChar()

        let bytes = hexToBytes(chars.join(""))

        this.pushToken(
            makeByteArrayLiteral({ value: bytes, site: this.rangeSite(site) })
        )
    }

    /**
     * Reads literal Utf8 string and immediately encodes it as a ByteArray
     * @private
     * @param {Site} site
     */
    readMaybeUtf8ByteArray(site) {
        let c = this.readChar()

        if (c == '"') {
            const s = this.readStringInternal(site)

            this.pushToken(
                makeByteArrayLiteral({
                    value: encodeUtf8(s),
                    site: this.rangeSite(site)
                })
            )
        } else {
            this.unreadChar()

            this.readWord(site, "b")
        }
    }

    /**
     * Doesn't push a token, instead returning the string itself
     * @private
     * @param {Site} site
     * @returns {string}
     */
    readStringInternal(site) {
        let c = this.readChar()

        const chars = []

        let escaping = false

        /**
         * This site is used for escape syntax errors
         * @type {Option<Site>}
         */
        let escapeSite = null

        while (!(!escaping && c == '"')) {
            if (c == "\0") {
                this.addSyntaxError(site, "unmatched '\"'")
                break
            }

            if (escaping) {
                if (c == "n") {
                    chars.push("\n")
                } else if (c == "t") {
                    chars.push("\t")
                } else if (c == "\\") {
                    chars.push("\\")
                } else if (c == '"') {
                    chars.push(c)
                } else if (isSome(escapeSite)) {
                    this.addSyntaxError(
                        this.rangeSite(escapeSite),
                        `invalid escape sequence ${c}`
                    )
                } else {
                    throw new Error("escape site should be non-null")
                }

                escaping = false
                escapeSite = null
            } else {
                if (c == "\\") {
                    escapeSite = this.currentSite
                    escaping = true
                } else {
                    chars.push(c)
                }
            }

            c = this.readChar()
        }

        return chars.join("")
    }

    /**
     * Reads literal string delimited by double quotes.
     * Allows for three escape character: '\\', '\n' and '\t'
     * @private
     * @param {Site} site
     */
    readString(site) {
        const s = this.readStringInternal(site)

        this.pushToken(
            makeStringLiteral({ value: s, site: this.rangeSite(site) })
        )
    }

    /**
     * Reads single or double character symbols
     * @private
     * @param {Site} site
     * @param {string} c0 - first character
     */
    readSymbol(site, c0) {
        const chars = [c0]

        /**
         * @param {string} second
         * @returns {boolean}
         */
        const parseSecondChar = (second) => {
            let d = this.readChar()

            if (d == second) {
                chars.push(d)
                return true
            } else {
                this.unreadChar()
                return false
            }
        }

        if (c0 == "|") {
            parseSecondChar("|")
        } else if (c0 == "&") {
            parseSecondChar("&")
        } else if (c0 == "=") {
            parseSecondChar("=") || parseSecondChar(">")
        } else if (c0 == "!" || c0 == "<" || c0 == ">") {
            // could be !=, ==, <= or >=
            parseSecondChar("=")
        } else if (c0 == ":") {
            parseSecondChar(":")
        } else if (c0 == "-") {
            parseSecondChar(">")
        }

        this.pushToken(
            makeSymbolToken({
                value: chars.join(""),
                site: this.rangeSite(site)
            })
        )
    }

    /**
     * Separates tokens in fields (separted by commas)
     * @private
     * @param {SymbolToken<GroupKind>} open
     * @param {Token[]} ts
     * @returns {TokenGroup}
     */
    buildGroup(open, ts) {
        /**
         * @type {SymbolToken[]}
         */
        const stack = [open]

        let curField = []

        let fields = []

        /**
         * @type {SymbolToken[]}
         */
        const separators = []

        /**
         * @type {Option<Site>}
         */
        let endSite = null

        let t = ts.shift()
        let prev = stack.pop()

        while (prev && t) {
            endSite = t.site

            if (!(t.kind == "symbol" && t.value == getOtherGroupSymbol(prev))) {
                stack.push(prev)

                if (t.kind == "symbol" && isGroupCloseSymbol(t)) {
                    this.addSyntaxError(t.site, `unmatched '${t.value}'`)
                } else if (t.kind == "symbol" && isGroupOpenSymbol(t)) {
                    stack.push(t)
                    curField.push(t)
                } else if (
                    t.kind == "symbol" &&
                    t.value == "," &&
                    stack.length == 1
                ) {
                    separators.push(t)

                    if (curField.length == 0) {
                        this.addSyntaxError(t.site, "empty field")
                    } else {
                        fields.push(curField)
                        curField = []
                    }
                } else {
                    curField.push(t)
                }
            } else if (stack.length > 0) {
                curField.push(t)
            }

            prev = stack.pop()
            t = ts.shift()
        }

        const last = stack.pop()
        if (last != undefined) {
            this.addSyntaxError(last.site, `EOF while matching '${last.value}'`)
        }

        if (curField.length > 0) {
            // add remaining field
            fields.push(curField)
        }

        if (separators.length > 0 && separators.length >= fields.length) {
            this.addSyntaxError(
                separators[separators.length - 1].site,
                `trailing comma`
            )
        }

        const groupSite = makeTokenSite({
            file: open.site.file,
            startLine: open.site.line,
            startColumn: open.site.column,
            endLine:
                endSite && !isDummySite(endSite)
                    ? endSite.line
                    : !isDummySite(open.site)
                      ? open.site.line
                      : undefined,
            endColumn:
                endSite && !isDummySite(endSite)
                    ? endSite.column
                    : !isDummySite(open.site)
                      ? open.site.column
                      : undefined
        })

        const group = makeGroup({
            kind: open.value,
            fields,
            separators,
            site: groupSite
        })
        if (group.error) {
            this.addSyntaxError(group.site, group.error)
        }
        return group
    }

    /**
     * Match group open with group close symbols in order to form groups.
     * This is recursively applied to nested groups.
     * @private
     * @param {Token[]} ts
     * @returns {Token[]}
     */
    nestGroups(ts) {
        /**
         * @type {Token[][]}
         */
        const stack = []

        /**
         * @type {Token[]}
         */
        let current = []

        for (let t of ts) {
            if (t.kind == "symbol" && isGroupOpenSymbol(t)) {
                stack.push(current)

                current = [t]
            } else if (t.kind == "symbol" && isGroupCloseSymbol(t)) {
                let open = current.shift()

                if (
                    !open ||
                    (open.kind == "symbol" &&
                        !t.matches(getOtherGroupSymbol(open)))
                ) {
                    if (open) {
                        this.addSyntaxError(
                            open.site,
                            `unmatched '${open.value}'`
                        )
                        // mutate to expected open SymbolToken
                        open.value = getOtherGroupSymbol(t)
                    } else {
                        open = makeSymbolToken({
                            value: getOtherGroupSymbol(t),
                            site: current[0]?.site ?? t.site
                        })
                    }

                    this.addSyntaxError(t.site, `unmatched '${t.value}'`)
                }

                if (
                    !open ||
                    open.kind != "symbol" ||
                    !isGroupOpenSymbol(open)
                ) {
                    throw new Error("unexpected")
                }

                const group = this.buildGroup(open, current.concat([t]))
                if (group.error) {
                    this.addSyntaxError(group.site, group.error)
                }
                current = stack.pop() ?? []

                current.push(group)
            } else {
                current.push(t)
            }
        }

        if (stack.length > 0) {
            const t = stack[stack.length - 1][0]

            if (t.kind != "symbol") {
                if (current.length > 0) {
                    const open = current[0]

                    if (open.kind == "symbol") {
                        this.addSyntaxError(
                            open.site,
                            `unmatched '${open.value}`
                        )
                    } else {
                        throw new Error("unhandled")
                    }
                }
            } else {
                this.addSyntaxError(t.site, `unmatched '${t.value}'`)
            }
        }

        return current
    }
}
