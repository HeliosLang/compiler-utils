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
     * @type {string[][]}
     */
    contentIndex

    /**
     * @readonly
     * @type {string}
     */
    name

    /**
     * @param {string} content
     * @param {SourceOptions} options
     */
    constructor(content, options = {}) {
        this.rawContent = content
        // one-step split to utf-8 runes in the content
        const codePoints = [...content]
        // heuristic for segment size
        this.segmentSize = Math.max(
            100,
            Math.floor(Math.sqrt(codePoints.length))
        )
        this.contentIndex = this.segmentContent(codePoints)
        this.length = codePoints.length
        this.name = options.name ?? "unknown"
    }

    /**
     * Number of characters in source content
     * @type {number}
     */
    length

    /**
     * splits long inputs to segments for more efficient access
     * @param {string[]} content
     * @returns {string[][]}
     */
    segmentContent(content) {
        const segments = /* @type string[][] */ []
        let i = 0
        while (i < content.length) {
            const chunk = content.slice(i, i + this.segmentSize)
            segments.push(chunk)
            i += this.segmentSize
        }
        return segments
    }

    /**
     * Get character from the underlying string index
     * Should work fine with utf-8 runes
     * @param {number} i
     * @returns {string}
     */
    getChar(i) {
        const segmentIndex = Math.floor(i / this.segmentSize)
        const segmentOffset = i % this.segmentSize
        const foundSegment =
            this.contentIndex[segmentIndex] ||
            (i == this.length ? [] : undefined)
        if (!foundSegment) {
            throw new Error("invalid position in Source")
        }
        return foundSegment[segmentOffset]
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
     * @type{[number, number][] | undefined}
     */
    lineLengths
    /*
     * Calculates the length of each line and the total length up to that line
     * @returns {[number, number][]}
     */
    calcLineLengths() {
        let accumulator = 0
        return (this.lineLengths = this.rawContent.split("\n").map((line) => {
            const len = [...line].length //utf-8 rune count
            return [len, (accumulator += len + 1)]
        }))
    }

    /**
     * Calculates the line and column number where the given character is located
     * @param {number} i - character index
     * @returns {[number, number]} - 0-based [line, column]
     */
    getPosition(i) {
        const lengths = this.lineLengths || this.calcLineLengths()
        if (i < 0 || i > this.length) {
            throw new Error("invalid position in Source")
        }
        const line = lengths.findIndex(([_, end]) => i < end)
        const col = i - (line > 0 ? lengths[line - 1][1] : 0)

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
        const lines = this.rawContent.split("\n")

        const nLines = lines.length
        const nDigits = Math.max(Math.ceil(Math.log10(nLines)), 2) // line-number is at least two digits

        for (let i = 0; i < nLines; i++) {
            lines[i] = String(i + 1).padStart(nDigits, "0") + "  " + lines[i]
        }

        return lines.join("\n")
    }
}
