import { segmentArray } from "@helios-lang/codec-utils"
import { None } from "@helios-lang/type-utils"

/**
 * @typedef {{
 *   name?: string
 * }} SourceOptions
 */

/**
 * A Source instance wraps a string so we can use it cheaply as a reference inside a Site.
 * Also used by VSCode plugin
 */
export class Source {
    /**
     * @readonly
     * @type {string}
     */
    content

    /**
     * Number of characters in source content
     * @type {number}
     * @readonly
     */
    length

    /**
     * Number of characters in each chunk
     * @type {number}
     * @readonly
     * */
    chunkSize

    /**
     * Segemented zones of the source content for more efficient access
     * @readonly
     * @type {string[][]}
     */
    contentChunks

    /**
     * @readonly
     * @type {string}
     */
    name

    /**
     * cache of line lengths in input source.  See lineLengths getter.
     * @type{Option<number[]>}
     * @private
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
        this.chunkSize = Math.max(
            100,
            Math.floor(Math.sqrt(asCodePoints.length))
        )
        this.contentChunks = segmentArray(asCodePoints, this.chunkSize)
        this.length = asCodePoints.length
        this.name = options.name ?? "unknown"
        this._lineEndLocations = None
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
                : this.contentChunks[Math.floor(i / this.chunkSize)]

        if (!targetChunk) {
            throw new Error(`invalid position in Source ${this.name}`)
        }
        const offset = i % this.chunkSize
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

    /*
     * Returns the location of each line-ending for fast line/column number lookup
     * @returns {number[]}
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
