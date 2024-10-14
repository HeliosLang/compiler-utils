export { makeBoolLiteral } from "./BoolLiteral.js"
export { makeByteArrayLiteral } from "./ByteArrayLiteral.js"
export { makeComment } from "./Comment.js"
export { makeGroup } from "./GenericGroup.js"
export { makeIntLiteral } from "./IntLiteral.js"
export { REAL_PRECISION, makeRealLiteral } from "./RealLiteral.js"
export { makeSource } from "./Source.js"
export { makeStringLiteral } from "./StringLiteral.js"
export { makeSymbolToken } from "./SymbolToken.js"
export { makeTokenizer } from "./Tokenizer.js"
export {
    anySymbol,
    anyWord,
    boollit,
    byteslit,
    group,
    intlit,
    oneOf,
    reallit,
    strlit,
    symbol,
    wildcard,
    word
} from "./TokenMatcher.js"
export { makeTokenReader } from "./TokenReader.js"
export { makeDummySite, makeTokenSite } from "./TokenSite.js"
export { makeWord } from "./Word.js"

/**
 * @template {string} [T=string]
 * @typedef {import("./Token.js").SymbolToken<T>} SymbolToken
 */

/**
 * @typedef {import("./GenericGroup.js").TokensLike} TokensLike
 */

/**
 * @template {TokensLike} [F=Token[]]
 * @typedef {import("./GenericGroup.js").GenericGroup<F>} GenericGroup
 */

/**
 * @typedef {import("./Source.js").Source} Source
 * @typedef {import("./SourceMap.js").SourceMap} SourceMap
 * @typedef {import("./Token.js").BoolLiteral} BoolLiteral
 * @typedef {import("./Token.js").ByteArrayLiteral} ByteArrayLiteral
 * @typedef {import("./Token.js").Comment} Comment
 * @typedef {import("./Token.js").IntLiteral} IntLiteral
 * @typedef {import("./Token.js").RealLiteral} RealLiteral
 * @typedef {import("./Token.js").StringLiteral} StringLiteral
 * @typedef {import("./Token.js").Token} Token
 * @typedef {import("./Token.js").TokenGroup} TokenGroup
 * @typedef {import("./Token.js").Word} Word
 * @typedef {import("./Tokenizer.js").Tokenizer} Tokenizer
 * @typedef {import("./TokenReader.js").TokenReader} TokenReader
 */

/**
 * @template {Token} [T=Token]
 * @typedef {import("./TokenMatcher.js").TokenMatcher<T>} TokenMatcher
 */
