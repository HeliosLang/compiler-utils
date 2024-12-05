import { segmentArray } from "@helios-lang/codec-utils"

/**
 * @import { AssertTrue, IsSame, SecondArgType } from "@helios-lang/type-utils"
 * @import { Source } from "../index.js"
 */

/**
 * @typedef {object} SourceOptions
 * @property {string} [name] - optional file name; defaults to  the module name parsed from the source's `<purpose> <name>` header
 * @property {string} [project] - optional project name; can be used to add  transpancy for advanced cross-project source-file reference use-cases
 * @property {string} [purpose] - helios-specific sources have a purpose
 * @property {string} [moduleName] - can differ from file name
 * @property {string} [moreInfo] - additional textual info about the source, useful in advanced code-generation cases
 */

/**
 * Assert the second of makeSource() is the same as SourceOptions (inlining that type gives friendlier documentation)
 * @typedef {AssertTrue<IsSame<NonNullable<SecondArgType<typeof makeSource>>, SourceOptions>>} _ignored
 */

/**
 * @param {string} content
 * @param {object} options
 * @param {string} [options.name] optional file name; defaults to the empty string
 * @param {string} [options.purpose] helios-specific sources have a purpose
 * @param {string} [options.moduleName] can differ from file name
 * @param {string} [options.project] optional project name; can be used to add  transpancy for advanced cross-project source-file reference use-cases
 * @param {string} [options.moreInfo] additional textual info about the source, useful in advanced code-generation cases
 * @returns {Source}
 */
export function makeSource(content, options = {}) {
    return new SourceImpl(content, options ?? {})
}

/**
 * Parses purpose and moduleName from source
 * @param {string} content
 * @param {object} options
 * @param {string} [options.name] optional file name; defaults to  the module name parsed from the source's `<purpose> <name>` header
 * @param {string} [options.project] optional project name; can be used to add  transpancy for advanced cross-project source-file reference use-cases
 * @param {string} [options.moreInfo] additional textual info about the source, useful in advanced code-generation cases
 * @returns {Source}
 */
export function makeHeliosSource(content, options = {}) {
    const { moduleName, purpose } = minimalScriptInfo(content)
    const name = options.name ?? moduleName

    return makeSource(content, {
        ...options,
        name,
        moduleName,
        purpose
    })
}

/**
 * A Source instance wraps a string so we can use it cheaply as a reference inside a Site.
 * Also used by VSCode plugin
 * @implements {Source}
 */
class SourceImpl {
    /**
     * @readonly
     * @type {string}
     */
    content

    /**
     * @readonly
     * @type {string}
     */
    name

    /**
     * Number of characters in source content
     * @readonly
     * @type {number}
     */
    length

    /**
     * module name of the source
     * @readonly
     * @type {string | undefined}
     */
    moduleName

    /**
     * declared script purpose of the source
     * @readonly
     * @type {string | undefined}
     */
    purpose

    /**
     * optional project name of the source
     * @readonly
     * @type {string | undefined}
     */
    project

    /**
     * additional textual info about the source, used in advanced code-generation cases
     * @readonly
     * @type {string | undefined}
     */
    moreInfo

    /**
     * Number of characters in each chunk
     * @private
     * @readonly
     * @type {number}
     */
    _chunkSize

    /**
     * Segemented zones of the source content for more efficient access
     * @private
     * @readonly
     * @type {string[][]}
     */
    _contentChunks

    /**
     * cache of line lengths in input source.  See lineLengths getter.
     * @private
     * @type {number[] | undefined}
     */
    _lineEndLocations

    /**
     * @param {string} content
     * @param {SourceOptions} options
     */
    constructor(content, options = {}) {
        this.content = content

        // one-step split to utf-8 runes in the content
        const asCodePoints = [...content]

        // heuristic for chunk size
        this._chunkSize = Math.max(
            100,
            Math.floor(Math.sqrt(asCodePoints.length))
        )

        this._contentChunks = segmentArray(asCodePoints, this._chunkSize)

        this.length = asCodePoints.length

        this.name = options.name ?? options.moduleName ?? ""
        this.moduleName = options.moduleName
        this.purpose = options.purpose
        this.project = options.project
        this.moreInfo = options.moreInfo

        this._lineEndLocations = undefined
    }

    /**
     * Get character from the underlying string index
     * Should work fine with utf-8 runes
     * @param {number} i
     * @returns {string}
     */
    getChar(i) {
        const targetChunk =
            i == this.length
                ? []
                : this._contentChunks[Math.floor(i / this._chunkSize)]

        if (!targetChunk) {
            throw new Error(`invalid position in Source ${this.name}`)
        }
        const offset = i % this._chunkSize
        return targetChunk[offset]
    }

    /**
     * Returns word at given character position
     * @param {number} i - character index
     * @returns {string} - empty string if not a word
     */
    getWord(i) {
        /**
         * @type {string[]}
         */
        const chars = []

        /**
         * @param {string | undefined} c
         * @returns {boolean}
         */
        function isWordChar(c) {
            if (c === undefined) {
                return false
            } else {
                return (
                    c == "_" ||
                    (c >= "0" && c <= "9") ||
                    (c >= "A" && c <= "Z") ||
                    (c >= "a" && c <= "z")
                )
            }
        }

        let c = this.getChar(i)

        while (isWordChar(c)) {
            chars.push(c)
            i += 1
            c = this.getChar(i)
        }

        return chars.join("")
    }

    /**
     * Returns the location of each line-ending for fast line/column number lookup
     * @type {number[]}
     */
    get lineEndLocations() {
        if (this._lineEndLocations) return this._lineEndLocations

        let lastOffset = 0
        return (this._lineEndLocations = this.content
            .split("\n")
            .map((line) => {
                const len = [...line].length //utf-8 rune count
                return (lastOffset += len + 1)
            }))
    }

    /**
     * Calculates the line and column number where the given character is located
     * @param {number} i - character index
     * @returns {[number, number]} - 0-based [line, column]
     */
    getPosition(i) {
        const lineEndings = this.lineEndLocations
        if (i < 0 || i > this.length) {
            throw new Error("invalid position in Source")
        }
        const line = lineEndings.findIndex((endOffset) => i < endOffset)
        const col = i - (line > 0 ? lineEndings[line - 1] : 0)

        return [line, col]
    }

    /**
     * Creates a more human-readable version of the source by prepending the line-numbers to each line.
     * The line-numbers are 1-based and consist of at least two digits
     * @example
     * (new Source("hello\nworld")).pretty() == "01  hello\n02  world"
     * @returns {string}
     */
    pretty() {
        const lines = this.content.split("\n")

        const nLines = lines.length
        const nDigits = Math.max(Math.ceil(Math.log10(nLines)), 2) // line-number is at least two digits

        for (let i = 0; i < nLines; i++) {
            lines[i] = String(i + 1).padStart(nDigits, "0") + "  " + lines[i]
        }

        return lines.join("\n")
    }
}

/**
 * extracts script purpose and name from a source string without dependency on full parser
 * @param {string} src
 * @returns {{ purpose: string, moduleName: string }}
 */
function minimalScriptInfo(src) {
    const [_, purpose, moduleName] =
        src.match(
            /(module|minting|spending|staking|testing|mixed|voting)\s+(\w+)/m
        ) || []
    if (!purpose) {
        throw new Error("missing or invalid script header: no purpose found")
    }
    if (!moduleName || !/^[a-zA-Z][_a-zA-Z0-9]*$/.test(moduleName)) {
        throw new Error(
            `invalid script header: invalid module name found: ${moduleName || "‹missing›"}`
        )
    }
    return { purpose, moduleName }
}
