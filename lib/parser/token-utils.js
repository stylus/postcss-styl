"use strict"

/**
 * Replace inline comment to css comment
 * @param {*} token
 */
function replaceInlineComment(token) {
    return `/*${token.value.slice(2)}*/`
}

/**
 * Replace escaped to css value
 * @param {*} token
 */
function replaceEscaped(token) {
    return token.value.slice(1)
}

module.exports = {
    tokensToRawCss(tokens) {
        const rawCss = []
        for (const token of tokens) {
            if (typeof token === "string") {
                rawCss.push(token)
            } else if (token.type === "inline-comment") {
                rawCss.push(replaceInlineComment(token))
            } else if (token.type === "escaped-whitespace") {
                rawCss.push(replaceEscaped(token))
            } else {
                rawCss.push(token.value)
            }
        }
        return rawCss.join("")
    },
    tokensToRawStylus(tokens) {
        const rawStylus = []
        for (const token of tokens) {
            if (typeof token === "string") {
                rawStylus.push(token)
            } else {
                rawStylus.push(token.value)
            }
        }
        return rawStylus.join("")
    },
    tokensToRaws,
    createCommentTokenInfo(before, commentToken) {
        const raws = tokensToRaws(before)
        return {
            token: commentToken,
            before: raws.raw,
            stylusBefore: raws.stylus,
        }
    },
    isEndOfLineToken,
    isSkipToken,
    isCommentToken,
    isWhitespaceToken,
}

/**
 * Tokens to raw info
 * @param {*} tokens
 */
function tokensToRaws(tokens) {
    const value = []
    const rawCss = []
    const rawStylus = []
    for (const token of tokens) {
        if (typeof token === "string") {
            rawStylus.push(token)
            rawCss.push(token)
            value.push(token)
        } else {
            rawStylus.push(token.value)
            if (token.type === "inline-comment") {
                rawCss.push(replaceInlineComment(token))
            } else if (token.type === "escaped-whitespace") {
                const val = replaceEscaped(token)
                rawCss.push(val)
                value.push(val)
            } else {
                rawCss.push(token.value)
                if (token.type !== "comment") {
                    value.push(token.value)
                }
            }
        }
    }
    return {
        value: value.join(""),
        raw: rawCss.join(""),
        stylus: rawStylus.join(""),
    }
}

/**
 * Checks if skip target token
 * @param {*} token token
 */
function isSkipToken(token) {
    return isWhitespaceToken(token) || isCommentToken(token)
}

/**
 * Checks if comment token
 * @param {*} token token
 */
function isCommentToken(token) {
    return (
        token && (token.type === "comment" || token.type === "inline-comment")
    )
}

/**
 * Checks if whitespace token
 * @param {*} token token
 */
function isWhitespaceToken(token) {
    return (
        token &&
        (token.type === "whitespace" ||
            token.type === "linebreak" ||
            token.type === "escaped-whitespace")
    )
}

/**
 * Checks if end of line token
 * @param {*} token token
 */
function isEndOfLineToken(token) {
    return (
        token && (token.type === "inline-comment" || token.type === "linebreak")
    )
}
