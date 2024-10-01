import { comparePos } from "../errors/Site.js"

/**
 * @typedef {import("../errors/Site.js").Pos} Pos
 * @typedef {import("../errors/Site.js").Site} Site
 */

const DUMMY_FILE_NAME = "::internal"

/**
 * @implements {Site}
 */
export class TokenSite {
    /**
     * @param {string} file
     * @param {number} startLine - first char of Token, 0-based index
     * @param {number} startColumn - first char of Token, 0-based index
     * @param {number} endLine - first char after Token (aka exclusive), 0-based index
     * @param {number} endColumn - first char after Token (aka exclusive), 0-based index
     */
    constructor(
        file,
        startLine,
        startColumn,
        endLine = startLine,
        endColumn = startColumn + 1
    ) {
        this.file = file
        this.startLine = startLine
        this.startColumn = startColumn
        this.endLine = endLine
        this.endColumn = endColumn
    }

    static dummy() {
        return new TokenSite(DUMMY_FILE_NAME, 0, 0)
    }

    /**
     * @param {Site} site
     * @returns {boolean}
     */
    static isDummy(site) {
        return (
            site.file == DUMMY_FILE_NAME && site.line == 0 && site.column == 0
        )
    }

    /**
     * @param {Site} a
     * @param {Site} b
     * @returns {TokenSite}
     */
    static merge(a, b) {
        const file = a.file

        let startLine = a.line
        let startColumn = a.column

        if (comparePos(a, b) > 0) {
            startLine = b.line
            startColumn = b.column
        }

        let endLine = a.end?.line ?? a.line
        let endColumn = a.end?.column ?? a.column

        if (comparePos(a.end ?? a, b.end ?? b) > 0) {
            endLine = b.end?.line ?? b.line
            endColumn = b.end?.column ?? b.column
        }

        return new TokenSite(file, startLine, startColumn, endLine, endColumn)
    }

    /**
     * @type {number}
     */
    get line() {
        return this.startLine
    }

    /**
     * @type {number}
     */
    get column() {
        return this.startColumn
    }

    /**
     * @type {Pos}
     */
    get end() {
        return {
            line: this.endLine,
            column: this.endColumn
        }
    }

    /**
     * Returns a 1-based representation of the Site
     * @returns {string}
     */
    toString() {
        return `${this.file}:${this.startLine + 1}:${this.startColumn + 1}`
    }
}
