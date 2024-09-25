import { CompilerError } from "./CompilerError.js"

/**
 * @typedef {import("./Site.js").Site} Site
 */

export class ErrorCollector {
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
