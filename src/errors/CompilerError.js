/**
 * @typedef {import("./Site.js").Site} Site
 */

const COMPILER_ERROR_KINDS = /** @type {const} */ ([
    "ReferenceError",
    "SyntaxError",
    "TypeError"
])

/**
 * @typedef {typeof COMPILER_ERROR_KINDS extends ReadonlyArray<infer T> ? T : never} CompilerErrorKind
 */

/**
 * @typedef {Error & {
 *   kind: CompilerErrorKind
 *   site: Site
 *   originalMessage: string
 *   otherErrors: CompilerErrorI[] | null
 * }} CompilerErrorI
 */

/**
 * @implements {CompilerErrorI}
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
     * @type {CompilerErrorI[] | null}
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
            if (e instanceof Error) {
                const err = /** @type {Error | CompilerErrorI} */ (e)

                if ("kind" in err && COMPILER_ERROR_KINDS.includes(err.kind)) {
                    return onError()
                }
            }

            throw e
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
