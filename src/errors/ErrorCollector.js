import { makeSyntaxError } from "./CompilerError.js"

/**
 * @import { CompilerError, ErrorCollector, Site } from "../index.js"
 */

/**
 * @returns {ErrorCollector}
 */
export function makeErrorCollector() {
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
        this.errors.push(makeSyntaxError(site, msg))
    }

    /**
     * Throws an error if the more this contains at least 1 error
     */
    throw() {
        if (this.errors.length > 0) {
            const [firstError, ...others] = this.errors
            firstError.otherErrors = others
            throw firstError
        }
    }
}
