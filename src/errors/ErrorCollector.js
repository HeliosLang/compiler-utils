import { CompilerError } from "./CompilerError.js"

/**
 * @typedef {import("./CompilerError.js").CompilerErrorI} CompilerErrorI
 * @typedef {import("./Site.js").Site} Site
 */

/**
 * @typedef {{
 *   errors: CompilerErrorI[]
 *   syntax(site: Site, msg: string): void
 *   throw(): void
 * }} ErrorCollectorI
 */

/**
 * @implements {ErrorCollectorI}
 */
export class ErrorCollector {
    /**
     * @readonly
     * @type {CompilerErrorI[]}
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
