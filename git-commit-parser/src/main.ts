// import * as formatter from './format';
// import * as edit from './edit';
import * as scanner from './scanner'
import * as parser from './parser'

export const createScanner: (text: string) => GitCommitScanner =
  scanner.createScanner

export const enum ScanError {
  None = 0,
  InvalidUnicode = 1,
  InvalidCharacter = 2,
}

export const enum SyntaxKind {
  WhiteSpace = 0,
  WordLiteral = 1,
  NumericLiteral = 2,
  OpenParenToken = 3,
  CloseParenToken = 4,
  ExclamationMarkToken = 5,
  ColonToken = 6,
  HashMarkToken = 7,
  LineBreakToken = 8,
  Comment = 9,
  Symbol = 10,
  EOF = 11,
}

/**
 * The scanner object, representing a git commit scanner at a position in the input string.
 */
export interface GitCommitScanner {
  /**
   * Sets the scan position to a new offset. A call to 'scan' is needed to get the first token.
   */
  setPosition(pos: number): void
  /**
   * Read the next token. Returns the token code.
   */
  scan(): SyntaxKind
  /**
   * Returns the zero-based current scan position, which is after the last read token.
   */
  getPosition(): number
  /**
   * Returns the last read token.
   */
  getToken(): SyntaxKind
  /**
   * Returns the last read token value. The value for strings is the decoded string content. For numbers it's of type number, for boolean it's true or false.
   */
  getTokenValue(): string
  /**
   * The zero-based start offset of the last read token.
   */
  getTokenOffset(): number
  /**
   * The length of the last read token.
   */
  getTokenLength(): number
  /**
   * The zero-based start line number of the last read token.
   */
  getTokenStartLine(): number
  /**
   * The zero-based start character (column) of the last read token.
   */
  getTokenStartCharacter(): number
  /**
   * An error code of the last scan.
   */
  getTokenError(): ScanError
}

/**
 * For a given offset, evaluate the location in the git commit document. Each segment in the location path is either a property name or an array index.
 */
export const getLocation: (text: string, position: number) => Location =
  parser.getLocation

/**
 * Parses the given text and returns the object the git commit content represents. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
 * Therefore, always check the errors list to find out if the input was valid.
 */
// export const parse: (
//   text: string,
//   errors?: ParseError[],
//   options?: ParseOptions
// ) => any = parser.parse

/**
 * Parses the given text and returns a tree representation the git commit content. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
 */
export const parseTree: (
  text: string,
  errors?: ParseError[],
  options?: ParseOptions
) => Node | undefined = parser.parseTree

/**
 * Finds the node at the given path in a git commit message.
 */
// export const findNodeAtLocation: (
//   root: Node,
//   path: CommitContentPath
// ) => Node | undefined = parser.findNodeAtLocation

/**
 * Finds the innermost node at the given offset. If includeRightBound is set, also finds nodes that end at the given offset.
 */
export const findNodeAtOffset: (
  root: Node,
  offset: number,
  includeRightBound?: boolean
) => Node | undefined = parser.findNodeAtOffset

/**
 * Gets the git commit path of the given git commit message node
 */
// export const getNodePath: (node: Node) => CommitContentPath = parser.getNodePath

/**
 * Evaluates the JavaScript object of the given git commit message node
 */
// export const getNodeValue: (node: Node) => any = parser.getNodeValue

/**
 * Parses the given text and invokes the visitor functions for each object, array and literal reached.
 */
export const visit: (
  text: string,
  visitor: GitCommitVisitor,
  options?: ParseOptions
) => any = parser.visit

export interface ParseError {
  error: ParseErrorCode
  offset: number
  length: number
}

export const enum ParseErrorCode {
  InvalidSymbol = 1,
  InvalidNumberFormat = 2,
  PropertyNameExpected = 3,
  ValueExpected = 4,
  ColonExpected = 5,
  CommaExpected = 6,
  CloseParenExpected = 7,
  CloseBracketExpected = 8,
  EndOfFileExpected = 9,
  InvalidCommentToken = 10,
  UnexpectedEndOfComment = 11,
  UnexpectedEndOfString = 12,
  UnexpectedEndOfNumber = 13,
  InvalidUnicode = 14,
  InvalidEscapeCharacter = 15,
  InvalidCharacter = 16,
}

export function printParseErrorCode(code: ParseErrorCode) {
  switch (code) {
    case ParseErrorCode.InvalidSymbol:
      return 'InvalidSymbol'
    case ParseErrorCode.InvalidNumberFormat:
      return 'InvalidNumberFormat'
    case ParseErrorCode.PropertyNameExpected:
      return 'PropertyNameExpected'
    case ParseErrorCode.ValueExpected:
      return 'ValueExpected'
    case ParseErrorCode.ColonExpected:
      return 'ColonExpected'
    case ParseErrorCode.CommaExpected:
      return 'CommaExpected'
    case ParseErrorCode.CloseParenExpected:
      return 'CloseParenExpected'
    case ParseErrorCode.CloseBracketExpected:
      return 'CloseBracketExpected'
    case ParseErrorCode.EndOfFileExpected:
      return 'EndOfFileExpected'
    case ParseErrorCode.InvalidCommentToken:
      return 'InvalidCommentToken'
    case ParseErrorCode.UnexpectedEndOfComment:
      return 'UnexpectedEndOfComment'
    case ParseErrorCode.UnexpectedEndOfString:
      return 'UnexpectedEndOfString'
    case ParseErrorCode.UnexpectedEndOfNumber:
      return 'UnexpectedEndOfNumber'
    case ParseErrorCode.InvalidUnicode:
      return 'InvalidUnicode'
    case ParseErrorCode.InvalidEscapeCharacter:
      return 'InvalidEscapeCharacter'
    case ParseErrorCode.InvalidCharacter:
      return 'InvalidCharacter'
  }
  return '<unknown ParseErrorCode>'
}

export type NodeType =
  | 'message'
  | 'header'
  | 'type'
  | 'scope-paren-open'
  | 'scope'
  | 'scope-paren-close'
  | 'breaking-exclamation-mark'
  | 'description'
  | 'body'
  | 'breaking-change-literal'
  // TODO: ref? | 'footer-reference'
  | 'footer'
  | 'footer-word-token'
  | 'footer-word'
  | 'footer-token'
  | 'word'
  | 'whitespace'
  | 'number'
  | 'symbol'

export interface Node {
  readonly type: NodeType
  readonly value?: any
  readonly offset: number
  readonly length: number
  readonly colonOffset?: number
  readonly parent?: Node
  readonly children?: Node[]
}

/**
 * A {@linkcode CommitContentPath} segment. Either a string representing an object property name
 * or a number (starting at 0) for array indices.
 */
export type Segment = string | number
export type CommitContentPath = Segment[]

export interface Location {
  /**
   * The previous property key or literal value (string, number, boolean or null) or undefined.
   */
  previousNode?: Node
  /**
   * The path describing the location in the git commit message. The path consists of a sequence of strings
   * representing an object property or numbers for array indices.
   */
  path: CommitContentPath
  /**
   * Matches the locations path against a pattern consisting of strings (for properties) and numbers (for array indices).
   * '*' will match a single segment of any property name or index.
   * '**' will match a sequence of segments of any property name or index, or no segment.
   */
  matches: (patterns: CommitContentPath) => boolean
}

export interface ParseOptions {
}

/**
 * Visitor called by {@linkcode visit} when parsing the git commit message.
 *
 * The visitor functions have the following common parameters:
 * - `offset`: Global offset within the git commit message, starting at 0
 * - `startLine`: Line number, starting at 0
 * - `startCharacter`: Start character (column) within the current line, starting at 0
 *
 * Additionally some functions have a `pathSupplier` parameter which can be used to obtain the
 * current `GitCommitPath` within the document.
 */
export interface GitCommitVisitor {
  /**
   * Invoked when an open brace is encountered and an object is started. The offset and length represent the location of the open brace.
   */
  onHeaderBegin?: (
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number,
    pathSupplier: () => CommitContentPath
  ) => void

  /**
   * Invoked when a closing brace is encountered and an object is completed. The offset and length represent the location of the closing brace.
   */
  onHeaderEnd?: (
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number
  ) => void


  /**
   * Invoked when an open brace is encountered and an object is started. The offset and length represent the location of the open brace.
   */
  onTypeBegin?: (
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number,
    pathSupplier: () => CommitContentPath
  ) => void

  /**
   * Invoked when a closing brace is encountered and an object is completed. The offset and length represent the location of the closing brace.
   */
  onTypeEnd?: (
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number
  ) => void

  /**
   * Invoked when an open brace is encountered and an object is started. The offset and length represent the location of the open brace.
   */
  onScopeParenOpen?: (
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number,
  ) => void

  /**
   * Invoked when an open brace is encountered and an object is started. The offset and length represent the location of the open brace.
   */
  onScopeBegin?: (
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number,
    pathSupplier: () => CommitContentPath
  ) => void

  /**
   * Invoked when a closing brace is encountered and an object is completed. The offset and length represent the location of the closing brace.
   */
  onScopeEnd?: (
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number
  ) => void

  /**
   * Invoked when an open brace is encountered and an object is started. The offset and length represent the location of the open brace.
   */
  onScopeParenClose?: (
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number,
  ) => void

  /**
   * Invoked when an open brace is encountered and an object is started. The offset and length represent the location of the open brace.
   */
  onDescriptionBegin?: (
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number,
    pathSupplier: () => CommitContentPath
  ) => void

  /**
   * Invoked when a closing brace is encountered and an object is completed. The offset and length represent the location of the closing brace.
   */
  onDescriptionEnd?: (
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number
  ) => void

  /**
   * Invoked when an open brace is encountered and an object is started. The offset and length represent the location of the open brace.
   */
  onBodyBegin?: (
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number,
    pathSupplier: () => CommitContentPath
  ) => void

  /**
   * Invoked when a closing brace is encountered and an object is completed. The offset and length represent the location of the closing brace.
   */
  onBodyEnd?: (
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number
  ) => void

  /**
   * Invoked when an open brace is encountered and an object is started. The offset and length represent the location of the open brace.
   */
  onFooterBegin?: (
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number,
    pathSupplier: () => CommitContentPath
  ) => void

  /**
   * Invoked when a closing brace is encountered and an object is completed. The offset and length represent the location of the closing brace.
   */
  onFooterEnd?: (
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number
  ) => void

  /**
   * Invoked when a literal value is encountered. The offset and length represent the location of the literal value.
   */
  onBreakingExclamationMark?: (
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number,
  ) => void

  /**
   * Invoked when a literal value is encountered. The offset and length represent the location of the literal value.
   */
  onHeaderColon?: (
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number,
  ) => void

  /**
   * Invoked when a literal value is encountered. The offset and length represent the location of the literal value.
   */
  onLiteralValue?: (
    value: any,
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number,
    pathSupplier: () => CommitContentPath
  ) => void

  /**
   * Invoked when a literal value is encountered. The offset and length represent the location of the literal value.
   */
  onWordValue?: (
    value: any,
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number,
    pathSupplier: () => CommitContentPath
  ) => void

  /**
   * Invoked when a literal value is encountered. The offset and length represent the location of the literal value.
   */
  onWhitespaceValue?: (
    value: any,
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number,
    pathSupplier: () => CommitContentPath
  ) => void

  /**
   * Invoked when a literal value is encountered. The offset and length represent the location of the literal value.
   */
  onNumber?: (
    value: any,
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number,
    pathSupplier: () => CommitContentPath
  ) => void

  /**
   * Invoked when a literal value is encountered. The offset and length represent the location of the literal value.
   */
  onSymbol?: (
    value: any,
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number,
    pathSupplier: () => CommitContentPath
  ) => void

  /**
   * Invoked when a comma or colon separator is encountered. The offset and length represent the location of the separator.
   */
  // onSeparator?: (
  //   character: string,
  //   offset: number,
  //   length: number,
  //   startLine: number,
  //   startCharacter: number
  // ) => void

  /**
   * Invoked when a line comment is encountered. The offset and length represent the location of the comment.
   */
  onComment?: (
    value: any,
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number
  ) => void

  /**
   * Invoked on an error.
   */
  onError?: (
    error: ParseErrorCode,
    offset: number,
    length: number,
    startLine: number,
    startCharacter: number
  ) => void
}

// /**
//  * An edit result describes a textual edit operation. It is the result of a {@linkcode format} and {@linkcode modify} operation.
//  * It consist of one or more edits describing insertions, replacements or removals of text segments.
//  * * The offsets of the edits refer to the original state of the document.
//  * * No two edits change or remove the same range of text in the original document.
//  * * Multiple edits can have the same offset if they are multiple inserts, or an insert followed by a remove or replace.
//  * * The order in the array defines which edit is applied first.
//  * To apply an edit result use {@linkcode applyEdits}.
//  * In general multiple EditResults must not be concatenated because they might impact each other, producing an incorrect or malformed git commit message.
//  */
// export type EditResult = Edit[]

// /**
//  * Represents a text modification
//  */
// export interface Edit {
//   /**
//    * The start offset of the modification.
//    */
//   offset: number
//   /**
//    * The length of the modification. Must not be negative. Empty length represents an *insert*.
//    */
//   length: number
//   /**
//    * The new content. Empty content represents a *remove*.
//    */
//   content: string
// }

// /**
//  * A text range in the document
//  */
// export interface Range {
//   /**
//    * The start offset of the range.
//    */
//   offset: number
//   /**
//    * The length of the range. Must not be negative.
//    */
//   length: number
// }

// /**
//  * Options used by {@linkcode format} when computing the formatting edit operations
//  */
// export interface FormattingOptions {
//   /**
//    * If indentation is based on spaces (`insertSpaces` = true), the number of spaces that make an indent.
//    */
//   tabSize?: number
//   /**
//    * Is indentation based on spaces?
//    */
//   insertSpaces?: boolean
//   /**
//    * The default 'end of line' character. If not set, '\n' is used as default.
//    */
//   eol?: string
//   /**
//    * If set, will add a new line at the end of the document.
//    */
//   insertFinalNewline?: boolean
// }

// /**
//  * Computes the edit operations needed to format a git commit message.
//  *
//  * @param documentText The input text
//  * @param range The range to format or `undefined` to format the full content
//  * @param options The formatting options
//  * @returns The edit operations describing the formatting changes to the original document following the format described in {@linkcode EditResult}.
//  * To apply the edit operations to the input, use {@linkcode applyEdits}.
//  */
// export function format(
//   documentText: string,
//   range: Range | undefined,
//   options: FormattingOptions
// ): EditResult {
//   return formatter.format(documentText, range, options)
// }

// /**
//  * Options used by {@linkcode modify} when computing the modification edit operations
//  */
// export interface ModificationOptions {
//   /**
//    * Formatting options. If undefined, the newly inserted code will be inserted unformatted.
//    */
//   formattingOptions?: FormattingOptions
//   /**
//    * Default false. If `GitCommitPath` refers to an index of an array and `isArrayInsertion` is `true`, then
//    * {@linkcode modify} will insert a new item at that location instead of overwriting its contents.
//    */
//   isArrayInsertion?: boolean
//   /**
//    * Optional function to define the insertion index given an existing list of properties.
//    */
//   getInsertionIndex?: (properties: string[]) => number
// }

// /**
//  * Computes the edit operations needed to modify a value in the git commit message.
//  *
//  * @param documentText The input text
//  * @param path The path of the value to change. The path represents either to the document root, a property or an array item.
//  * If the path points to an non-existing property or item, it will be created.
//  * @param value The new value for the specified property or item. If the value is undefined,
//  * the property or item will be removed.
//  * @param options Options
//  * @returns The edit operations describing the changes to the original document, following the format described in {@linkcode EditResult}.
//  * To apply the edit operations to the input, use {@linkcode applyEdits}.
//  */
// export function modify(
//   text: string,
//   path: CommitContentPath,
//   value: any,
//   options: ModificationOptions
// ): EditResult {
//   return edit.setProperty(text, path, value, options)
// }

// /**
//  * Applies edits to an input string.
//  * @param text The input text
//  * @param edits Edit operations following the format described in {@linkcode EditResult}.
//  * @returns The text with the applied edits.
//  * @throws An error if the edit operations are not well-formed as described in {@linkcode EditResult}.
//  */
// export function applyEdits(text: string, edits: EditResult): string {
//   for (let i = edits.length - 1; i >= 0; i--) {
//     text = edit.applyEdit(text, edits[i])
//   }
//   return text
// }
