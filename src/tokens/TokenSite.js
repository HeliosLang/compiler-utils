/**
 * @typedef {import("../errors/Site.js").Site} Site
 */

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
        return new TokenSite("::internal", 0, 0)
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
     * Returns a 1-based representation of the Site
     * @returns {string}
     */
    toString() {
        return `${this.file}:${this.startLine + 1}:${this.startColumn + 1}`
    }
}
