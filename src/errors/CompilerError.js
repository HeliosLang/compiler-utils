/**
 * @import { CompilerError, CompilerErrorKind, Site } from "src/index.js"
 */

/**
 *
 * @param {CompilerErrorKind} kind
 * @param {Site} site
 * @param {string} msg
 * @returns {CompilerError}
 */
function makeCompilerError(kind, site, msg) {
    return new CompilerErrorImpl(kind, site, msg)
}

/**
 * @param {Site} site
 * @param {string} msg
 * @returns {CompilerError}
 */
export function makeReferenceError(site, msg) {
    return makeCompilerError("ReferenceError", site, msg)
}

/**
 * @param {Site} site
 * @param {string} msg
 * @returns {CompilerError}
 */
export function makeSyntaxError(site, msg) {
    return makeCompilerError("SyntaxError", site, msg)
}

/**
 * @param {Site} site
 * @param {string} msg
 * @returns {CompilerError}
 */
export function makeTypeError(site, msg) {
    return makeCompilerError("TypeError", site, msg)
}

/**
 * @param {Error} err
 * @returns {err is CompilerError}
 */
export function isCompilerError(err) {
    return err instanceof CompilerErrorImpl
}

/**
 * @implements {CompilerError}
 */
class CompilerErrorImpl extends Error {
    /**
     * @readonly
     * @type {CompilerErrorKind}
     */
    kind

    /**
     * @readonly
     * @type {Site}
     */
    site

    /**
     * @readonly
     * @type {string}
     * */
    originalMessage

    /**
     * @type {CompilerError[] | undefined}
     */
    otherErrors

    /**
     * @param {CompilerErrorKind} kind
     * @param {Site} site
     * @param {string} msg
     */
    constructor(kind, site, msg) {
        super(`${kind} (${site.toString()}): ${msg}`)
        this.kind = kind
        this.site = site
        this.originalMessage = msg
        this.otherErrors = undefined
    }

    /**
     * @type {"CompilerError"}
     */
    get name() {
        return "CompilerError"
    }
}
