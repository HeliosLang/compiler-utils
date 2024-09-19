/**
 * Gathers log messages produced by a Helios program
 * @typedef {{
 *   logPrint: (message: string) => void
 *   lastMsg: string
 *   logTrace?: Option<(message: string) => void>
 *   logError?: Option<(message: string) => void>
 *   flush?: Option<(addlMessage?: string) => void>
 *   reset? : Option<(reason: ("build" | "validate")) => void>
 * }} UplcLoggingI
 */

/**
 * @implements {UplcLoggingI}
 */
export class BasicUplcLogger {
    /**
     * @type {string}
     */
    lastMsg

    constructor() {
        this.lastMsg = ""
    }

    /**
     * emits a message from a Helios program
     * @param {string} msg
     * @returns {void}
     */
    logPrint(msg) {
        this.lastMsg = msg
        console.log(msg)
    }

    reset() {}
}
