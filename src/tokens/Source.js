/**
 * A Source instance wraps a string so we can use it cheaply as a reference inside a Site.
 * Also used by VSCode plugin
 */
export class Source {
    /**
     * @readonly
     * @type {string}
     */
    name

    /**
     * @readonly
     * @type {string}
     */
    content

    /**
     * @param {string} name
     * @param {string} content
     */
    constructor(name, content) {
        this.name = name
        this.content = content
    }

    /**
     * Number of characters in source content
     * @type {number}
     */
    get length() {
        return this.content.length
    }

    /**
     * Get character from the underlying string.
     * Should work fine with utf-8 runes
     * @param {number} i
     * @returns {string}
     */
    getChar(i) {
        return this.content[i]
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

        let c = this.content[i]

        while (isWordChar(c)) {
            chars.push(c)
            i += 1
            c = this.content[i]
        }

        return chars.join("")
    }

    /**
     * Calculates the line and column number where the given character is located
     * @param {number} i - character index
     * @returns {[number, number]} - 0-based [line, column]
     */
    getPosition(i) {
        let col = 0
        let line = 0

        for (let j = 0; j < i; j++) {
            if (this.content[j] == "\n") {
                col = 0
                line += 1
            } else {
                col += 1
            }
        }

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
