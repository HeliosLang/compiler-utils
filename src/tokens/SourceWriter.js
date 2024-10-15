/**
 * @import { Token } from "src/index.js"
 */

/**
 * Used for accurate formatting
 * @typedef {{
 *   finalize(): string
 *   write(s: string): void
 *   writeToken(token: Token): void
 * }} SourceWriter
 */

/**
 * @param {{line?: number, column?: number}} args
 * @returns {SourceWriter}
 */
export function makeSourceWriter(args = {}) {
    return new SourceWriterImpl({
        line: args.line ?? 0,
        column: args.column ?? 0
    })
}

/**
 * @implements {SourceWriter}
 */
class SourceWriterImpl {
    /**
     * @private
     * @type {string[]}
     */
    parts

    /**
     * @param {{line: number, column: number}} position
     */
    constructor(position = { line: 0, column: 0 }) {
        this.line = position.line
        this.column = position.column
        this.parts = []
    }

    /**
     * @private
     * @param {number} line
     * @param {number} column
     */
    fillDifference(line, column) {
        const dl = Math.max(line - this.line, 0)
        const dc =
            line == this.line ? Math.max(column - this.column, 0) : column

        const d = new Array(dl).fill("\n").concat(new Array(dc).fill(" "))

        const s = d.join("")

        if (s != "") {
            this.parts.push(s)
            this.line = line
            this.column = column
        }
    }

    /**
     * @param {string} s
     */
    write(s) {
        const lines = s.split("\n")
        const dl = lines.length - 1

        this.line = this.line + dl
        this.column =
            dl == 0 ? this.column + s.length : lines[lines.length - 1].length
        this.parts.push(s)
    }

    /**
     * @param {Token} token
     */
    writeToken(token) {
        this.fillDifference(token.site.line, token.site.column)
        this.write(token.toString(true))
    }

    /**
     * @returns {string}
     */
    finalize() {
        return this.parts.join("")
    }
}
