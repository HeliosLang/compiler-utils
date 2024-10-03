import { encodeUtf8, hexToBytes } from "@helios-lang/codec-utils"
import { isSome } from "@helios-lang/type-utils"
import { ErrorCollector } from "../errors/index.js"
import { BoolLiteral } from "./BoolLiteral.js"
import { ByteArrayLiteral } from "./ByteArrayLiteral.js"
import { Group } from "./Group.js"
import { IntLiteral } from "./IntLiteral.js"
import { REAL_PRECISION, RealLiteral } from "./RealLiteral.js"
import { Source } from "./Source.js"
import { SourceIndex } from "./SourceIndex.js"
import { StringLiteral } from "./StringLiteral.js"
import { SymbolToken } from "./SymbolToken.js"
import { TokenSite } from "./TokenSite.js"
import { Word } from "./Word.js"
import { Comment } from "./Comment.js"

/**
 * @typedef {import("../errors/index.js").Site} Site
 * @typedef {import("./SourceMap.js").SourceMap} SourceMap
 * @typedef {import("./Token.js").Token} Token
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

export class Tokenizer {
    /**
     * @private
     * @readonly
     * @type {Set<string>}
     */
    validFirstLetters

    /**
     * @readonly
     * @type {number}
     */
    realPrecision

    /**
     * @readonly
     * @type {boolean}
     */
    tokenizeReal

    /**
     * @readonly
     * @type {boolean}
     */
    preserveComments

    /**
     * @readonly
     * @type {boolean}
     */
    allowLeadingZeroes

    /**
     * Current character index
     * @private
     * @type {SourceIndex}
     */
    sourceIndex

    /**
     * Tokens are accumulated in this list
     * @private
     * @type {Token[]}
     */
    tokens

    /**
     * Basic syntax errors are accumulated here
     * @readonly
     * @type {ErrorCollector}
     */
    errors

    /**
     * @param {Source} source
     * @param {TokenizerOptions} options
     */
    constructor(source, options = {}) {
        this.validFirstLetters = new Set(
            (
                DEFAULT_VALID_FIRST_LETTERS +
                (options?.extraValidFirstLetters ?? "")
            ).split("")
        )
        this.realPrecision = options?.realPrecision ?? REAL_PRECISION
        this.tokenizeReal = options?.tokenizeReal ?? true
        this.preserveComments = options?.preserveComments ?? false
        this.allowLeadingZeroes = options?.allowLeadingZeroes ?? false

        this.sourceIndex = new SourceIndex(source, options.sourceMap)
        this.tokens = [] // reset to empty to list at start of tokenize()
        this.errors = options.errorCollector ?? new ErrorCollector()
    }

    /**
     * Tokenize the complete source.
     * @param {boolean} nestGroups - Nest groups before returning a list of tokens
     * @returns {Token[]}
     */
    tokenize(nestGroups = true) {
        this.tokens = []

        let site = this.currentSite
        let c = this.readChar()

        while (c != "\0") {
            this.readToken(site, c)

            site = this.currentSite
            c = this.readChar()
        }

        if (nestGroups) {
            return this.nestGroups(this.tokens)
        } else {
            return this.tokens
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
        this.tokens = []

        let site = this.currentSite
        let c = this.readChar()

        while (c != "\0") {
            this.readToken(site, c)

            let t = this.tokens.shift()
            while (t != undefined) {
                yield t
                t = this.tokens.shift()
            }

            site = this.currentSite
            c = this.readChar()
        }

        if (this.tokens.length != 0) {
            throw new Error("unexpected")
        }
    }

    /**
     * @type {Site}
     */
    get currentSite() {
        return this.sourceIndex.site
    }

    /**
     * @param {Site} start
     * @returns {TokenSite}
     */
    rangeSite(start) {
        const end = this.currentSite

        return new TokenSite({
            file: start.file,
            startLine: start.line,
            startColumn: start.column,
            endLine: end.line,
            endColumn: end.column,
            alias: start.alias
        })
    }

    /**
     * @param {Site} site
     * @param {string} msg
     */
    addSyntaxError(site, msg) {
        this.errors.syntax(site, msg)
    }

    /**
     * @param {Token} t
     */
    pushToken(t) {
        this.tokens.push(t)

        /*if (this.#codeMap !== null && this.#codeMapPos < this.#codeMap.length) {
			let pair = (this.#codeMap[this.#codeMapPos]);

			if (pair[0] == t.site.startPos) {
				t.site.setCodeMapSite(pair[1]);
				this.#codeMapPos += 1;
			}
		}*/
    }

    /**
     * Reads a single char from the source and advances #pos by one
     * @returns {string}
     */
    readChar() {
        return this.sourceIndex.readChar()
    }

    /**
     * @returns {string}
     */
    peekChar() {
        return this.sourceIndex.peekChar()
    }

    /**
     * Decreases source index pos by one
     */
    unreadChar() {
        this.sourceIndex.unreadChar()
    }

    /**
     * Start reading precisely one token
     * @param {Site} site
     * @param {string} c
     */
    readToken(site, c) {
        if (c == "b") {
            this.readMaybeUtf8ByteArray(site)
        } else if (this.validFirstLetters.has(c)) {
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
     * @param {Site} site
     * @param {string} c0 - first character
     */
    readWord(site, c0) {
        let chars = []

        let c = c0
        while (c != "\0") {
            if ((c >= "0" && c <= "9") || this.validFirstLetters.has(c)) {
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
            this.pushToken(BoolLiteral.fromString(value, wordSite))
        } else {
            this.pushToken(new Word(value, wordSite))
        }
    }

    /**
     * Reads and discards a comment if current '/' char is followed by '/' or '*'.
     * Otherwise pushes Symbol('/') onto #ts
     * @param {Site} site
     */
    // comments are discarded
    readMaybeComment(site) {
        let c = this.readChar()

        if (c == "\0") {
            this.pushToken(new SymbolToken("/", site))
        } else if (c == "/") {
            this.readSingleLineComment(site)
        } else if (c == "*") {
            this.readMultiLineComment(site)
        } else {
            this.pushToken(new SymbolToken("/", site))
            this.unreadChar()
        }
    }

    /**
     * Reads and discards a single line comment (from '//' to end-of-line)
     * @param {Site} site
     */
    readSingleLineComment(site) {
        let c = this.readChar()
        const chars = ["/", "/", c]

        while (c != "\n" && c != "\0") {
            c = this.readChar()
            chars.push(c)
        }

        if (this.preserveComments) {
            this.pushToken(new Comment(chars.join(""), this.rangeSite(site)))
        }
    }

    /**
     * Reads and discards a multi-line comment (from '/' '*' to '*' '/')
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

        if (this.preserveComments) {
            this.pushToken(new Comment(chars.join(""), this.rangeSite(site)))
        }
    }

    /**
     * REads a literal integer
     * @param {Site} site
     */
    readSpecialInteger(site) {
        let c = this.readChar()

        if (c == "\0") {
            this.pushToken(new IntLiteral(0n, site))
        } else if (c == "b") {
            this.readBinaryInteger(site)
        } else if (c == "o") {
            this.readOctalInteger(site)
        } else if (c == "x") {
            this.readHexInteger(site)
        } else if ((c >= "A" && c <= "Z") || (c >= "a" && c <= "z")) {
            this.addSyntaxError(site, `bad literal integer type 0${c}`)
        } else if (c >= "0" && c <= "9") {
            if (this.allowLeadingZeroes) {
                this.readDecimal(site, c)
            } else {
                this.addSyntaxError(site, "unexpected leading 0")
            }
        } else if (c == "." && this.tokenizeReal) {
            this.readFixedPoint(site, ["0"])
        } else {
            this.pushToken(new IntLiteral(0n, site))
            this.unreadChar()
        }
    }

    /**
     * @param {Site} site
     */
    readBinaryInteger(site) {
        this.readRadixInteger(site, "0b", (c) => c == "0" || c == "1")
    }

    /**
     * @param {Site} site
     */
    readOctalInteger(site) {
        this.readRadixInteger(site, "0o", (c) => c >= "0" && c <= "7")
    }

    /**
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
                } else if (c == "." && this.tokenizeReal) {
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
            new IntLiteral(
                BigInt(chars.filter((c) => c != "_").join("")),
                intSite
            )
        )
    }

    /**
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
            new IntLiteral(
                BigInt(prefix + chars.join("")),
                this.rangeSite(site)
            )
        )
    }

    /**
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

        if (trailing.length > this.realPrecision) {
            this.addSyntaxError(
                tokenSite,
                `literal real decimal places overflow (max ${this.realPrecision} supported, but ${trailing.length} specified)`
            )
            trailing.splice(this.realPrecision)
        }

        while (trailing.length < this.realPrecision) {
            trailing.push("0")
        }

        this.pushToken(
            new RealLiteral(
                BigInt(leading.concat(trailing).join("")),
                tokenSite
            )
        )
    }

    /**
     * Reads literal hexadecimal representation of ByteArray
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

        this.pushToken(new ByteArrayLiteral(bytes, this.rangeSite(site)))
    }

    /**
     * Reads literal Utf8 string and immediately encodes it as a ByteArray
     * @param {Site} site
     */
    readMaybeUtf8ByteArray(site) {
        let c = this.readChar()

        if (c == '"') {
            const s = this.readStringInternal(site)

            this.pushToken(
                new ByteArrayLiteral(encodeUtf8(s), this.rangeSite(site))
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
     * @param {Site} site
     */
    readString(site) {
        const s = this.readStringInternal(site)

        this.pushToken(new StringLiteral(s, this.rangeSite(site)))
    }

    /**
     * Reads single or double character symbols
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

        this.pushToken(new SymbolToken(chars.join(""), this.rangeSite(site)))
    }

    /**
     * Separates tokens in fields (separted by commas)
     * @param {SymbolToken} open
     * @param {Token[]} ts
     * @returns {Group}
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

            if (!SymbolToken.isSymbol(t, Group.otherSymbol(prev))) {
                stack.push(prev)

                if (Group.isCloseSymbol(t)) {
                    this.addSyntaxError(t.site, `unmatched '${t.value}'`)
                } else if (Group.isOpenSymbol(t)) {
                    stack.push(t)
                    curField.push(t)
                } else if (SymbolToken.isSymbol(t, ",") && stack.length == 1) {
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

        const groupSite = new TokenSite({
            file: open.site.file,
            startLine: open.site.line,
            startColumn: open.site.column,
            endLine: endSite ? endSite.line : open.site.line,
            endColumn: endSite ? endSite.column : open.site.column
        })

        const group = new Group(open.value, fields, separators, groupSite)
        if (group.error) {
            this.addSyntaxError(group.site, group.error)
        }
        return group
    }

    /**
     * Match group open with group close symbols in order to form groups.
     * This is recursively applied to nested groups.
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
            if (Group.isOpenSymbol(t)) {
                stack.push(current)

                current = [t]
            } else if (Group.isCloseSymbol(t)) {
                let open = SymbolToken.asSymbol(current.shift())

                if (!open || !t.matches(Group.otherSymbol(open))) {
                    if (open) {
                        this.addSyntaxError(
                            open.site,
                            `unmatched '${open.value}'`
                        )
                        // mutate to expected open SymbolToken
                        open.value = Group.otherSymbol(t)
                    } else {
                        open = new SymbolToken(
                            Group.otherSymbol(t),
                            current[0]?.site ?? t.site
                        )
                    }

                    this.addSyntaxError(t.site, `unmatched '${t.value}'`)
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

            if (!SymbolToken.isSymbol(t)) {
                if (current.length > 0) {
                    const open = current[0]

                    if (SymbolToken.isSymbol(open)) {
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
