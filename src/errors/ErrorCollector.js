import { CompilerError } from "./CompilerError.js"

/**
 * @typedef {import("./Site.js").Site} Site
 */

/**
 * @typedef {{
 *   errors: CompilerError[]
 *   syntax(site: Site, msg: string): void
 *   throw(): void
 * }} ErrorCollector
 */

/**
 * @param {{}} _args
 * @returns {ErrorCollector}
 */
export function makeErrorCollector(_args = {}) {
    return new ErrorCollectorImpl()
}

/**
 * @implements {ErrorCollector}
 */
class ErrorCollectorImpl {
    /**
     * @readonly
     * @type {CompilerError[]}
     */
    errors

    constructor() {
        this.errors = []
    }

    /**
     * @param {Site} site
     * @param {string} msg
     */
    syntax(site, msg) {
        this.errors.push(CompilerError.syntax(site, msg))
    }

    throw() {
        if (this.errors.length > 0) {
            const [firstError, ...others] = this.errors
            firstError.otherErrors = others
            throw firstError
        }
    }
}
