/**
 * @typedef {{
 *   line: number
 *   column: number
 * }} Pos
 */

/**
 * @typedef {Pos & {
 *   file: string
 *   end?: Pos
 *   toString: () => string
 * }} Site
 */

/**
 * @param {Pos} a
 * @param {Pos} b
 * @returns {number} - if negative, a comes before b, if positive b comes before a
 */
export function comparePos(a, b) {
    if (a.line == b.line) {
        return a.column - b.column
    } else {
        return a.line - b.line
    }
}
