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
 * }} BoolLiteralI
 */

/**
 * @typedef {CommonTokenProps & {
 *   kind: "bytes"
 *   value: number[]
 *   isEqual(other: Token): boolean
 * }} ByteArrayLiteralI
 */

/**
 * @typedef {CommonTokenProps & {
 *   kind: "comment"
 *   value: string
 *   isEqual(other: Token): boolean
 * }} CommentI
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
 *   separators: SymbolTokenI[]
 *   error: string | null
 *   isKind(kind: string): boolean
 *   isGroup(kind?: Option<string>, nFields?: Option<number>): boolean
 * }} CommonGroupProps
 */

/**
 * @typedef {CommonGroupProps & {
 *   fields: Token[][]
 * }} TokenGroupI
 */

/**
 * @typedef {CommonTokenProps & {
 *   kind: "int",
 *   value: bigint
 *   isEqual(other: Token): boolean
 * }} IntLiteralI
 */

/**
 * @typedef {CommonTokenProps & {
 *   kind: "real"
 *   value: bigint
 *   isEqual(other: Token): boolean
 * }} RealLiteralI
 */

/**
 * @typedef {CommonTokenProps & {
 *   kind: "string"
 *   value: string
 *   isEqual(other: Token): boolean
 * }} StringLiteralI
 */

/**
 * @template {string} [T=string]
 * @typedef {CommonTokenProps & {
 *   kind: "symbol"
 *   value: T
 *   isEqual(other: Token): boolean
 *   matches(value: string | ReadonlyArray<string>): boolean
 * }} SymbolTokenI
 */

/**
 * @typedef {CommonTokenProps & {
 *   kind: "word"
 *   value: string
 *   isEqual(other: Token): boolean
 *   isInternal(): boolean
 *   isKeyword(): boolean
 *   matches(value: string | string[]): boolean
 * }} WordI
 */

/**
 * @typedef {(
 *   BoolLiteralI
 *   | ByteArrayLiteralI
 *   | CommentI
 *   | TokenGroupI
 *   | IntLiteralI
 *   | RealLiteralI
 *   | StringLiteralI
 *   | SymbolTokenI
 *   | WordI
 * )} Token
 */
