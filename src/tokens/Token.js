export {}

/**
 * @typedef {import("../errors/index.js").Site} Site
 */

/**
 * @typedef {{
 *   site: Site
 *   toString(preserveWhitespace?: boolean): string
 * }} CommonTokenProps
 */

/**
 * @typedef {CommonTokenProps & {
 *   kind: "bool"
 *   value: boolean
 *   isEqual(other: Token): boolean
 * }} BoolLiteral
 */

/**
 * @typedef {CommonTokenProps & {
 *   kind: "bytes"
 *   value: number[]
 *   isEqual(other: Token): boolean
 * }} ByteArrayLiteral
 */

/**
 * @typedef {CommonTokenProps & {
 *   kind: "comment"
 *   value: string
 *   isEqual(other: Token): boolean
 * }} Comment
 */

export const GROUP_OPEN_SYMBOLS = /** @type {const} */ (["(", "[", "{"])
export const GROUP_CLOSE_SYMBOLS = /** @type {const} */ ([")", "]", "}"])

/**
 * @typedef {typeof GROUP_OPEN_SYMBOLS extends ReadonlyArray<infer T> ? T : never} GroupKind
 */

/**
 * @typedef {typeof GROUP_CLOSE_SYMBOLS extends ReadonlyArray<infer T> ? T : never} GroupCloseKind
 */

/**
 * @typedef {CommonTokenProps & {
 *   kind: GroupKind
 *   separators: SymbolToken[]
 *   error: string | null
 *   isGroup(kind?: Option<string>, nFields?: Option<number>): boolean
 * }} CommonGroupProps
 */

/**
 * @typedef {CommonGroupProps & {
 *   fields: Token[][]
 * }} TokenGroup
 */

/**
 * @typedef {CommonTokenProps & {
 *   kind: "int",
 *   value: bigint
 *   isEqual(other: Token): boolean
 * }} IntLiteral
 */

/**
 * @typedef {CommonTokenProps & {
 *   kind: "real"
 *   value: bigint
 *   isEqual(other: Token): boolean
 * }} RealLiteral
 */

/**
 * @typedef {CommonTokenProps & {
 *   kind: "string"
 *   value: string
 *   isEqual(other: Token): boolean
 * }} StringLiteral
 */

/**
 * @template {string} [T=string]
 * @typedef {CommonTokenProps & {
 *   kind: "symbol"
 *   value: T
 *   isEqual(other: Token): boolean
 *   matches(value: string | ReadonlyArray<string>): boolean
 * }} SymbolToken
 */

/**
 * @typedef {CommonTokenProps & {
 *   kind: "word"
 *   value: string
 *   isEqual(other: Token): boolean
 *   isInternal(): boolean
 *   isKeyword(): boolean
 *   matches(value: string | string[]): boolean
 * }} Word
 */

/**
 * @typedef {(
 *   BoolLiteral
 *   | ByteArrayLiteral
 *   | Comment
 *   | TokenGroup
 *   | IntLiteral
 *   | RealLiteral
 *   | StringLiteral
 *   | SymbolToken
 *   | Word
 * )} Token
 */

/**
 * @param {Token} t
 * @returns {t is TokenGroup}
 */
export function isGroup(t) {
    return t.kind == "(" || t.kind == "{" || t.kind == "["
}
