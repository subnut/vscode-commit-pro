import {
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextEdit,
} from 'vscode-languageserver'
import { CommitMessageProvider, ConfigSet } from './commit-message-provider'
import * as parser from 'git-commit-parser'
import { GitService } from './git-service'

const getNewTextEdit = (rootNode: parser.Node, nodeType: parser.NodeType) => {
  const node = parser.getRangeForCommitPosition(rootNode, nodeType)
  const textEdit: Omit<TextEdit, 'newText'> | undefined = node
    ? {
        range: {
          start: node.start,
          end: node.end,
        },
      }
    : undefined

  return (newText: string): TextEdit | undefined => {
    if (!textEdit) {
      return undefined
    }
    return {
      range: textEdit.range,
      newText,
    }
  }
}

export class CompletionProvider {
  constructor(
    private readonly commitMessageProvider: CommitMessageProvider,
    private readonly gitService: GitService
  ) {}

  // This handler provides the initial list of the completion items.
  async provideCompletion(
    textDocumentPosition: TextDocumentPositionParams
  ): Promise<CompletionItem[]> {
    const documentUri = textDocumentPosition.textDocument.uri

    const parsedCommit =
      await this.commitMessageProvider.getParsedTreeForDocumentUri(documentUri)
    if (!parsedCommit) {
      return []
    }
    const configSet = await this.commitMessageProvider.getConfig(
      parsedCommit.config?.configUri,
      documentUri
    )
    const offset = this.commitMessageProvider.offsetAtPosition(
      textDocumentPosition.textDocument.uri,
      textDocumentPosition.position
    )

    const parseOutcome = parsedCommit.parseOutcome
    const rootNode = parseOutcome?.root

    if (!parseOutcome || !rootNode) {
      return []
    }

    const node = parser.findNodeAtOffset(rootNode, offset, true)

    if (!node) {
      return []
    }

    const completions: {
      [key: string]: () => CompletionItem[] | Promise<CompletionItem[]>
    } = {
      type: () => this.getCompletionTypes(configSet, rootNode, parseOutcome),
      scope: () => this.getCompletionScopes(configSet, rootNode),
      'scope-paren-open': () => this.getCompletionScopes(configSet, rootNode),
      'scope-paren-close': () =>
        this.getCompletionBreakingExclamationMark(configSet, parseOutcome),
    }

    const completionItemKeys = Object.keys(completions)

    let upNode: parser.Node | undefined = node
    while (upNode) {
      if (completionItemKeys.includes(upNode.type)) {
        return completions[upNode.type]()
      }
      upNode = upNode.parent
    }
    return []
  }

  async getCompletionTypes(
    configSet: ConfigSet,
    root: parser.Node,
    parseOutcome: parser.ParseOutcome
  ): Promise<CompletionItem[]> {
    const typeEnumRule = configSet?.config?.rules?.['type-enum']
    const ruleDisabled = (typeEnumRule?.[0] ?? 0) === 0
    const ruleAlways = typeEnumRule?.[1] === 'always'
    const typeEnumValues = typeEnumRule?.[2] ?? []
    if (!ruleDisabled && ruleAlways && typeEnumValues.length > 0) {
      const textEditForNewText = getNewTextEdit(root, 'type')
      const hasScope = !!parseOutcome.header?.scope
      const hasBreakingExclamationMark =
        !!parseOutcome.header?.breakingExclamationMark
      return typeEnumValues
        .map((type) => ({
          label: type,
          kind: CompletionItemKind.Enum,
          // TODO: documentation
          // TODO: detail
          // TODO: labelDetails
          // TODO: sortText to ensure order from config
          textEdit: textEditForNewText(type),
        }))
        .flatMap((completion) => {
          if (
            !hasScope &&
            !hasBreakingExclamationMark &&
            completion.label === parseOutcome.header?.type
          ) {
            // if this label is already fully written-out, offer the same with breaking exclamation mark
            return [
              completion,
              {
                ...completion,
                // TODO: documentation
                // TODO: detail
                // TODO: labelDetails
                label: `${completion.label}!`,
                kind: CompletionItemKind.Operator,
                textEdit: textEditForNewText(`${completion.label}!`),
              },
            ]
          }
          return [completion]
        })
    }

    // get types from history
    if (configSet.workspaceUri) {
      const typeData = await this.gitService.getTypeDataForWorkspace(
        configSet.workspaceUri
      )
      if (typeData.length > 0) {
        const textEditForNewText = getNewTextEdit(root, 'type')
        return typeData.map(({ type, count, lastUsed }, index) => ({
          label: type,
          kind: CompletionItemKind.Enum,
          detail: `From git log introspection: ${count} times used, last time ${lastUsed}`,
          textEdit: textEditForNewText(type),
          sortText: `${`${999 - count}`.padStart(3, '0')}-${`${index}`.padStart(
            3,
            '0'
          )}`,
        }))
      }
    }

    // TODO: propose defaults (combined with history)
    return []
  }

  async getCompletionScopes(
    configSet: ConfigSet,
    root: parser.Node
  ): Promise<CompletionItem[]> {
    // TODO: check if rule is always applied
    const scopeEnumRule = configSet?.config?.rules?.['scope-enum']
    const scopeEnumValues = scopeEnumRule?.[2] ?? []
    if (scopeEnumValues.length > 0) {
      const textEditForNewText = getNewTextEdit(root, 'scope')
      return scopeEnumValues.map((scope) => ({
        label: scope,
        kind: CompletionItemKind.Enum,
        // TODO: documentation
        // TODO: detail
        // TODO: labelDetails
        // TODO: sortText to ensure order from config
        textEdit: textEditForNewText(scope),
      }))
    }

    // get scopes from history
    if (configSet.workspaceUri) {
      const scopeData = await this.gitService.getScopeDataForWorkspace(
        configSet.workspaceUri
      )
      if (scopeData.length > 0) {
        const textEditForNewText = getNewTextEdit(root, 'scope')
        return scopeData.map(({ scope, count, lastUsed }, index) => ({
          label: scope,
          kind: CompletionItemKind.Enum,
          detail: `From git log introspection: ${count} times used, last time ${lastUsed}`,
          textEdit: textEditForNewText(scope),
          sortText: `${`${999 - count}`.padStart(3, '0')}-${`${index}`.padStart(
            3,
            '0'
          )}`,
        }))
      }
    }

    // TODO: propose scopes from workspace
    // * package.json workspace
    // * yarn workspace
    // * lerna workspace
    // * src subsfolders
    // * ...
    return []
  }

  getCompletionBreakingExclamationMark(
    configSet: ConfigSet,
    parseOutcome: parser.ParseOutcome
  ): CompletionItem[] {
    // TODO: check if breaking exclamation mark is not wanted

    // check if breaking exclamation mark is already there
    const existingBreakingExclamationMark =
      parseOutcome.header?.breakingExclamationMark
    if (existingBreakingExclamationMark) {
      return []
    }

    // TODO: also enable exclamation mark after type, not only after scope brackets

    return [
      {
        label: 'Breaking Change "!"',
        kind: CompletionItemKind.Operator,
        insertText: '!',
      },
    ]
  }

  // This handler resolves additional information for the item selected in
  // the completion list.
  resolveCompletion(item: CompletionItem): CompletionItem {
    if (item.label === 'fantasy') {
      item.detail = 'Fantasy details'
      item.documentation = 'Fantasy documentation'
    } else if (item.data === 2) {
      item.detail = 'JavaScript details'
      item.documentation = 'JavaScript documentation'
    }
    return item
  }
}