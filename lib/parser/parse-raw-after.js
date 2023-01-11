"use strict"

const {
    tokensToRaws,
    isSkipToken,
    createCommentTokenInfo,
} = require("./token-utils")
const { findLastIndex } = require("./util")

module.exports = (sourceCode, end, options) => {
    const cursor = sourceCode.createBackwardTokenCursor(end)

    const after = []

    let token = cursor.next()
    let startIndex = token ? token.range[1] : end
    while (token && isRawToken(token, options)) {
        after.unshift(token)
        token = cursor.next()
    }

    let afterTokens =
        token &&
        token.value !== ";" &&
        token.value !== "}" &&
        token.value !== "{"
            ? stripStartLineComments(after)
            : after
    if (options.maxIndent != null) {
        // Process for
        // | .a
        // |   // comment
        // | // comment
        const maxIndent = options.maxIndent
        afterTokens = processComment(sourceCode, afterTokens, maxIndent)
    }

    startIndex = afterTokens.length ? afterTokens[0].range[0] : startIndex

    const buffer = []
    const inlineComments = []
    for (const afterToken of afterTokens) {
        if (afterToken.type === "inline-comment") {
            inlineComments.push(createCommentTokenInfo(buffer, afterToken))
            buffer.length = 0
        } else {
            buffer.push(afterToken)
        }
    }

    const raws = tokensToRaws(buffer)

    return {
        after: raws.raw,
        stylusAfter: raws.stylus,
        startIndex,
        inlineComments,
    }
}

/**
 * Checks if raw target token
 * @param {*} token token
 * @param {*} options options
 */
function isRawToken(token, options) {
    if (isSkipToken(token)) {
        if (options.blockCommentAsRaw) {
            return true
        }
        return token.type !== "comment"
    }
    return false
}

/**
 * Process for comments
 * Comments beyond the indentation of the first token are child node comments.
 */
function processComment(sourceCode, tokens, maxIndent) {
    const nonTargetCommentIndex = findLastIndex(tokens, (token) => {
        if (token.type !== "inline-comment" && token.type !== "comment") {
            return false
        }
        const tokenIndent = sourceCode.getIndentFromIndex(token.range[0])
        return maxIndent < tokenIndent
    })
    if (nonTargetCommentIndex >= 0) {
        return tokens.slice(nonTargetCommentIndex + 1)
    }
    return tokens
}

/**
 * Get the first-line comments
 */
function stripStartLineComments(after) {
    // check first-line comments
    let hasComments = false
    for (let index = 0; index < after.length; index++) {
        const token = after[index]
        if (token.type === "inline-comment" || token.type === "comment") {
            hasComments = true
        } else if (token.type === "linebreak") {
            return hasComments ? after.slice(index) : after
        }
    }
    return hasComments ? [] : after
}
