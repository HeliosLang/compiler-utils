import { comparePos } from "../errors/Pos.js"

/**
 * @import { AssertTrue, FirstArgType, IsSame } from "@helios-lang/type-utils"
 * @import { Pos, Site } from "src/index.js"
 */

const DUMMY_FILE_NAME = "::internal"

/**
 * @typedef {{
 *   file: string
 *   startLine: number
 *   startColumn: number
 *   endLine?: number
 *   endColumn?: number
 *   description?: string
 * }} TokenSiteProps
 */

/**
 * @typedef {AssertTrue<IsSame<FirstArgType<typeof makeTokenSite>, TokenSiteProps>>} _ignored
 * @param {object} props
 * @param {string} props.file
 * The name of the source
 *
 * @param {number} props.startLine
 * The line number of the first character
 *
 * @param {number} props.startColumn
 * The column number of the first character
 *
 * @param {number} [props.endLine]
 * The (optional) line number of the last character
 *
 * @param {number} [props.endColumn]
 * The (optional) column number of the last character
 *
 * @param {string} [props.description]
 * An optional description which provides context to the UPLC runtime
 *
 * @returns {Site}
 */
export function makeTokenSite(props) {
    return new TokenSite(props)
}

/**
 * @implements {Site}
 */
class TokenSite {
    /**
     * @readonly
     * @type {string}
     */
    file

    /**
     * first char of Token, 0-based index
     * @readonly
     * @type {number}
     */
    startLine

    /**
     * first char of Token, 0-based index
     * @readonly
     * @type {number}
     */
    startColumn

    /**
     * first char after Token (aka exclusive), 0-based index
     * defaults to startLine
     * @readonly
     * @type {number}
     */
    endLine

    /**
     * first char after Token (aka exclusive), 0-based index
     * defaults to startColumn+1
     * @readonly
     * @type {number}
     */
    endColumn

    /**
     * Used for content that has a distinct name in the original Helios source
     * @readonly
     * @type {string | undefined}
     */
    description

    /**
     * @param {TokenSiteProps} props
     */
    constructor({
        file,
        startLine,
        startColumn,
        endLine = startLine,
        endColumn = startColumn + 1,
        description = undefined
    }) {
        this.file = file
        this.startLine = startLine
        this.startColumn = startColumn
        this.endLine = endLine
        this.endColumn = endColumn
        this.description = description
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

    /**
     * @param {string} description
     * @returns {TokenSite}
     */
    withDescription(description) {
        return new TokenSite({
            file: this.file,
            startLine: this.startLine,
            startColumn: this.startColumn,
            endLine: this.endLine,
            endColumn: this.endColumn,
            description
        })
    }
}

/**
 * @param {Site} site
 * @returns {boolean}
 */
export function isDummySite(site) {
    return site.file == DUMMY_FILE_NAME && site.line == 0 && site.column == 0
}

/**
 * @returns {Site}
 */
export function makeDummySite() {
    return new TokenSite({
        file: DUMMY_FILE_NAME,
        startLine: 0,
        startColumn: 0
    })
}

/**
 * @param {Site} a
 * @param {Site} b
 * @returns {Site}
 */
export function mergeSites(a, b) {
    if (isDummySite(b)) {
        return a
    } else if (isDummySite(a)) {
        return makeDummySite()
    }

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

    // alias is lost
    return new TokenSite({
        file,
        startLine,
        startColumn,
        endLine,
        endColumn
    })
}
