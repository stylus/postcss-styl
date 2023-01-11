"use strict"

const {
    tokensToRaws,
    isSkipToken,
    createCommentTokenInfo,
} = require("./token-utils")

module.exports = (sourceCode, start, end) => {
    const cursor = sourceCode.createTokenCursor(start, {
        endLocationIndex: end,
    })

    const inlineComments = []
    const buffer = []

    let token = cursor.next()
    let endIndex = token ? token.range[0] - 1 : start
    while (token && isSkipToken(token)) {
        if (token.type === "inline-comment") {
            inlineComments.push(createCommentTokenInfo(buffer, token))
            buffer.length = 0
        } else {
            buffer.push(token)
            endIndex = token.range[1] - 1
        }
        token = cursor.next()
    }

    const raws = tokensToRaws(buffer)

    return {
        before: raws.raw,
        stylusBefore: raws.stylus,
        endIndex,
        inlineComments,
    }
}
