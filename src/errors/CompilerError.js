/**
 * @typedef {import("./Site.js").Site} Site
 */

/**
 * @typedef {"ReferenceError" | "SyntaxError" | "TypeError"} CompilerErrorKind
 */

export class CompilerError extends Error {
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
     * @type {CompilerError[] | null}
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
        this.otherErrors = null
    }

    /**
     * @template A
     * @template B
     * @param {() => A} callback
     * @param {() => B} onError
     * @returns {A | B}
     */
    static catch(callback, onError) {
        try {
            const res = callback()

            return res
        } catch (e) {
            if (e instanceof CompilerError) {
                return onError()
            } else {
                throw e
            }
        }
    }

    /**
     * @param {Site} site
     * @param {string} msg
     * @returns {CompilerError}
     */
    static reference(site, msg) {
        return new CompilerError("ReferenceError", site, msg)
    }

    /**
     * @param {Site} site
     * @param {string} msg
     * @returns {CompilerError}
     */
    static syntax(site, msg) {
        return new CompilerError("SyntaxError", site, msg)
    }

    /**
     * @param {Site} site
     * @param {string} msg
     * @returns {CompilerError}
     */
    static type(site, msg) {
        return new CompilerError("TypeError", site, msg)
    }
}
