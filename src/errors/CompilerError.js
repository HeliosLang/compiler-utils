/**
 * @typedef {import("./Site.js").Site} Site
 */

/**
 * @typedef {"ReferenceError" | "SyntaxError" | "TypeError"} CompilerErrorKind
 */

export class CompilerError extends Error {
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
    }

    /**
     * @param {Site} site
     * @param {string} msg
     * @returns {CompilerError}
     */
    static syntax(site, msg) {
        return new CompilerError("SyntaxError", site, msg)
    }
}
