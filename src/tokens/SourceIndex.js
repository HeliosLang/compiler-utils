import { makeDummySite, makeTokenSite } from "./TokenSite.js"

/**
 * @typedef {import("../errors/Site.js").Site} Site
 * @typedef {import("./Source.js").Source} Source
 * @typedef {import("./SourceMap.js").SourceMap} SourceMap
 */

/**
 * @typedef {{
 *   site: Site
 *   incr(): void
 *   decr(): void
 *   readChar(): string
 *   peekChar(): string
 *   unreadChar(): void
 * }} SourceIndex
 */

/**
 * @param {{
 *   source: Source
 *   sourceMap?: Option<SourceMap>
 * }} args
 * @returns {SourceIndex}
 */
export function makeSourceIndex(args) {
    return new SourceIndexImpl(args.source, args.sourceMap)
}

/**
 * @implements {SourceIndex}
 */
class SourceIndexImpl {
    /**
     * @private
     * @readonly
     * @type {Source}
     */
    source

    /**
     * @private
     * @readonly
     * @type {Option<SourceMap>}
     */
    sourceMap

    /**
     * @private
     * @type {number}
     */
    value

    /**
     * @private
     * @type {number}
     */
    column

    /**
     * @private
     * @type {number}
     */
    line

    /**
     * @param {Source} source
     * @param {Option<SourceMap>} sourceMap
     */
    constructor(source, sourceMap) {
        this.source = source
        this.sourceMap = sourceMap

        this.value = 0
        this.column = 0
        this.line = 0
    }

    /**
     * @type {Site}
     */
    get site() {
        if (this.sourceMap) {
            return this.sourceMap.get(this.value) ?? makeDummySite()
        } else {
            return makeTokenSite({
                file: this.source.name,
                startLine: this.line,
                startColumn: this.column
            })
        }
    }

    /**
     * @private
     */
    assertValid() {
        if (this.value < 0) {
            throw new Error("invalid position in Source")
        }
    }

    incr() {
        const c = this.source.getChar(this.value)

        if (c == "\n") {
            this.column = 0
            this.line += 1
        } else {
            this.column += 1
        }

        this.value += 1
    }

    /**
     * @private
     */
    syncPosition() {
        const [line, col] = this.source.getPosition(this.value)

        this.line = line
        this.column = col
    }

    decr() {
        this.value -= 1
        this.assertValid()

        this.syncPosition()
    }

    /**
     * Reads a single char from the source and advances the index by one
     * @returns {string}
     */
    readChar() {
        let c

        if (this.value < this.source.length) {
            c = this.source.getChar(this.value)
        } else {
            c = "\0"
        }

        this.incr()

        return c
    }

    /**
     * @returns {string}
     */
    peekChar() {
        if (this.value < this.source.length) {
            return this.source.getChar(this.value)
        } else {
            return "\0"
        }
    }

    /**
     * Decreases value by one
     */
    unreadChar() {
        this.decr()
    }
}
