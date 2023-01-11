"use strict"

const Stringifier = require("postcss/lib/stringifier")

const DEFAULT_INDENT = "    "

/**
 * Checks if `@css` for a given node.
 * @param {*} node
 */
function isCssLiteral(node) {
    return node.type === "atrule" && node.name === "css" && node.cssLiteral
}

/**
 * Checks whether the given string is includes linebreak or not.
 * @param {string} s
 */
function hasLinebreak(s) {
    return /[\n\r]/u.test(s)
}

const leadingSpacesRe = /^\s*/u

/**
 * Get indent from the given line string.
 * @param {string} line
 */
function getIndentText(line) {
    return leadingSpacesRe.exec(line)[0]
}

/**
 * Replace indent text.
 * @param {string} line
 * @param {string} indent
 */
function replaceIndent(line, indent) {
    return line.replace(leadingSpacesRe, indent)
}

/**
 * Checks if pythonic for a given node.
 * @param {*} node
 */
function isPythonic(node) {
    if (!node || !node.pythonic) {
        return false
    }
    if (!node.nodes || !node.nodes.length) {
        // empty
        return false
    }
    // Check expression @block
    if (node.type === "atrule" && node.atblock) {
        const nameAndParams = node.name + node.params
        if (nameAndParams.toLowerCase() === "@block" || !nameAndParams.trim()) {
            // Expression @block (No assignment @block)
            return false
        }
    }
    // Check object expression
    if (node.type === "atrule" && node.object) {
        return false
    }
    return true
}

/**
 * Checks if object property for a given node.
 * @param {*} node
 */
function isObjectProperty(node) {
    if (!node.parent) {
        return false
    }
    if (node.objectProperty || node.parent.object) {
        return true
    }
    return false
}

/**
 * Checks if omittedSemi for a given node.
 * @param {*} node
 */
function isOmittedSemi(node) {
    if (!node.omittedSemi) {
        return false
    }
    if (isObjectProperty(node)) {
        const parent = node.parent
        const index = parent.nodes.indexOf(node)
        const nextNodes = parent.nodes.slice(index + 1)
        if (
            nextNodes.length &&
            nextNodes.every(
                (next) => next.raws.before && !next.raws.before.includes("\n"), // no line feed
            )
        ) {
            return false
        }
    }
    return true
}

/**
 * The source code split into lines according
 * @param {string} text source code
 * @returns {string[]} lines
 */
function toLines(text) {
    const lines = []

    const lineEndingPattern = /\r\n|\r|\n/gu
    let match = null

    let start = 0
    while ((match = lineEndingPattern.exec(text))) {
        const end = match.index + match[0].length
        lines.push(text.slice(start, end))
        start = end
    }
    lines.push(text.slice(start))

    return lines
}

/**
 * Checks if indent adjustment is required for a given node.
 * @param {*} node
 */
function isNeedAdjustIndent(node) {
    if (node.postfix) {
        return false
    }
    if (node.type === "comment") {
        const { parent } = node
        if (!parent || !parent.nodes) {
            return true
        }
        if (
            isPythonic(parent) &&
            parent.nodes.every((sibling) => sibling.type === "comment")
        ) {
            // All comments
            return parent.nodes[parent.nodes.length - 1] === node // The last comment requires indentation.
        }
        return false
    }
    let { parent } = node
    if (parent && parent.postfix) {
        parent = parent.parent
    }
    if (!parent) {
        return false
    }
    if (isPythonic(parent)) {
        return true
    } else if (parent.type === "root") {
        const index = parent.nodes.indexOf(node)
        if (index <= 0) {
            return false
        }
        const prevNodes = parent.nodes.slice(0, index).reverse()
        const prev = prevNodes.find((p) => p.type !== "comment")
        return isPythonic(prev)
    }
    return false
}

/**
 * Adjust the pythonic indent.
 * @param {string} indent
 * @param {string} targetBefore
 */
function adjustIndentBefore(indent, targetBefore) {
    const targetBeforeLines = toLines(targetBefore)

    targetBeforeLines.pop()
    if (!targetBeforeLines.length) {
        targetBeforeLines.push("\n")
    }
    targetBeforeLines.push(indent)

    return targetBeforeLines.join("")
}

/**
 * Remove comments on selector
 * @param {string} selector
 * @returns {string} removed comments
 */
function removeLastCommentsSelector(selector) {
    return selector.replace(/\/\/.*$/u, "").replace(/\/\*.*\*\/\s*$/u, "")
}

/**
 * Adjust selectors indent
 * @param {node} node
 * @param {string} selectors
 * @param {string} indent
 * @returns {string} indented selectors
 */
function adjustSelectorsIndent(node, selectors, indent) {
    const lines = toLines(selectors)

    return lines
        .map((line, index) => {
            const trimmed = line.trim()
            if (!trimmed) {
                // ignore blank line
                return line
            }

            if (!node.pythonic) {
                // If it is not pythonic, adjust the indentation other than comma delimiter.
                if (/^,/u.test(trimmed)) {
                    return line
                }
                const lastLine = lines[index - 1]
                if (
                    lastLine &&
                    /,$/u.test(removeLastCommentsSelector(lastLine).trim())
                ) {
                    return line
                }
            }
            if (index === 0) {
                // first line
                return replaceIndent(line, "")
            }
            return replaceIndent(line, indent)
        })
        .join("")
}

/**
 * Adjust params indent
 * @param {node} _node
 * @param {string} params
 * @param {string} indent
 * @returns {string} indented selectors
 */
function adjustParamsIndent(_node, params, indent) {
    const lines = toLines(params)

    return lines
        .map((line, index) => {
            const trimmed = line.trim()
            if (!trimmed) {
                // ignore blank line
                return line
            }

            if (index === 0) {
                // first line
                return replaceIndent(line, "")
            }
            if (
                index + 1 < lines.length &&
                indent.length <= getIndentText(line).length
            ) {
                // not last line and have the required indentation.
                return line
            }
            return replaceIndent(line, indent)
        })
        .join("")
}

class ParenStack {
    constructor() {
        this.parenStack = []
    }

    inParen() {
        return this.parenStack.length > 0
    }

    processText(text) {
        for (const c of text) {
            if (c === "(") {
                this.parenStack.unshift(")")
            } else if (c === "{") {
                this.parenStack.unshift("}")
            } else if (c === this.parenStack[0]) {
                this.parenStack.shift()
            }
        }
    }
}

/**
 * Adjust value indent
 * @param {node} node
 * @param {string} value
 * @param {string} baseIndent
 * @returns {string} indented selectors
 */
function adjustMultilineValueIndent(node, value, baseIndent) {
    const between =
        (node.raws && (node.raws.stylusBetween || node.raws.between)) || " "
    let indent = baseIndent
    let firstLineIndent = ""
    if (hasLinebreak(between)) {
        const lastIndent = toLines(between).pop()
        if (lastIndent.length > baseIndent.length) {
            indent = lastIndent
        } else {
            firstLineIndent = indent.slice(lastIndent.length)
        }
    }

    const parenStack = new ParenStack()

    const lines = toLines(value)
    return lines
        .map((line, index) => {
            const inParen = parenStack.inParen()
            parenStack.processText(line)
            if (inParen) {
                return line
            }

            if (index === 0) {
                // first line
                return replaceIndent(line, firstLineIndent)
            }
            if (indent.length <= getIndentText(line).length) {
                // have the required indentation.
                return line
            }
            return replaceIndent(line, indent)
        })
        .join("")
}

/**
 * Escape line breaks
 */
function escapeLinebreak(s) {
    const parenStack = new ParenStack()
    const lines = toLines(s)
    return lines
        .map((line, index) => {
            if (index + 1 === lines.length) {
                // last line
                return line
            }
            parenStack.processText(line)
            if (parenStack.inParen()) {
                return line
            }
            if (/,\s*$/u.test(line)) {
                return line
            }
            const offset = line.endsWith("\r\n") ? -2 : -1
            if (line[line.length + offset - 1] === "\\") {
                // Already escaped
                return line
            }
            return `${line.slice(0, offset)}\\${line.slice(offset)}`
        })
        .join("")
}

/**
 * Checks whether the given node prop is a adjust indent target.
 */
function isAdjustIndentTarget(node, prop) {
    if (prop === "selector" || prop === "params") {
        return true
    }
    if (prop === "value") {
        if (!isPythonic(node.parent)) {
            return false
        }
        return true
    }
    return false
}

module.exports = class StylusStringifier extends Stringifier {
    rawValue(node, prop) {
        const value = this.rawValuePlain(node, prop)
        if (isAdjustIndentTarget(node, prop) && hasLinebreak(value)) {
            const indent = this.getIndent(node)

            if (prop === "selector") {
                return adjustSelectorsIndent(node, value, indent)
            }
            if (prop === "params") {
                return adjustParamsIndent(node, value, indent)
            }
            // if(prop === "value") {
            return escapeLinebreak(
                adjustMultilineValueIndent(node, value, indent),
            )
        }
        return value
    }

    raw(node, own, detect) {
        const raw = this.rawPlain(node, own, detect)
        if (own === "before") {
            // adjust indent
            if (isNeedAdjustIndent(node)) {
                return adjustIndentBefore(this.getIndent(node), raw)
            }
        }

        return raw
    }

    block(node, start) {
        if (isPythonic(node) || node.postfix) {
            this._pythonicBlock(node, start)
            return
        }
        if (
            node.nodes &&
            node.last &&
            node.last.type === "comment" &&
            node.last.raws.inline
        ) {
            let after = this.raw(node, "after")

            if (!after.includes("\n")) {
                after += `\n${this.getIndent(node)}`
                let between = this.raw(node, "between", "beforeOpen")
                this.builder(`${start + between}{`, node, "start")
                this.body(node)
                this.builder(after)
                this.builder("}", node, "end")
                return
            }
        }
        super.block(node, start)
    }

    _pythonicBlock(node, start) {
        const between = !node.postfix
            ? this.raw(node, "between", "beforeOpen")
            : ""
        this.builder(start + between, node, "start")
        let after = null

        if (node.nodes && node.nodes.length) {
            this.body(node)
            after = this.raw(node, "after")
        } else {
            after = this.raw(node, "after", "emptyBody")
        }
        if (
            node.postfix &&
            node.raws.after == null &&
            node.raws.stylusAfter == null
        ) {
            after = ""
        }

        if (after) {
            this.builder(after)
        }
        this.builder("", node, "end")
    }

    root(node) {
        this.body(node)

        const rawAfter = node.raws.stylusAfter || node.raws.after
        if (rawAfter) {
            this.builder(rawAfter)
        }
    }

    // eslint-disable-next-line complexity -- X(
    atrule(node, semicolon) {
        if (isCssLiteral(node)) {
            new Stringifier(this.builder).atrule(node, semicolon)
            return
        }
        const needSemi = !isOmittedSemi(node) && semicolon
        const semiChar = needSemi && isObjectProperty(node) ? "," : ";"

        if (node.postfix && node.nodes) {
            this.block(node, "")
            if (node.raws && node.raws.postfixBefore != null) {
                this.builder(node.raws.postfixBefore)
            } else {
                this.builder(" ") // default
            }
        }
        let name =
            (node.raws.identifier == null ? "@" : node.raws.identifier) +
            node.name
        const params = node.params ? this.rawValue(node, "params") : ""

        if (typeof node.raws.afterName !== "undefined") {
            name += node.raws.afterName
        } else if (node.function || node.call || node.expression) {
            // name += ""
        } else if (params && name) {
            name += " "
        }

        let nameAndParams = name + params
        if (node.atblock) {
            // adjust @block
            if (isPythonic(node)) {
                nameAndParams = nameAndParams.replace(/@block$/iu, "")
            } else if (!/@block/iu.test(nameAndParams)) {
                nameAndParams += "@block"
            }
        }

        if (!node.postfix && node.nodes) {
            this.block(node, nameAndParams)
        } else {
            const end =
                (node.raws.stylusBetween || node.raws.between || "") +
                (needSemi ? semiChar : "")
            this.builder(nameAndParams + end, node)
        }

        if (node.raws.ownSemicolon) {
            this.builder(node.raws.ownSemicolon, node, "end")
        }
    }

    decl(node, semicolon) {
        const needSemi = !isOmittedSemi(node) && semicolon
        const semiChar = needSemi && isObjectProperty(node) ? "," : ";"
        if (needSemi && semiChar === ";") {
            super.decl(node, needSemi)
            return
        }
        super.decl(node, false)
        if (needSemi) {
            this.builder(semiChar, node)
        }
    }

    comment(node) {
        if (!node.raws.inline) {
            super.comment(node)
            return
        }
        const left = this.raw(node, "left", "commentLeft")
        const right = this.raw(node, "right", "commentRight")

        const text = node.raws.text || node.text
        this.builder(`//${left}${text}${right}`, node)
    }

    rawValuePlain(node, prop) {
        const value = node[prop]
        const raw = node.raws[prop]

        if (raw && raw.value === value && raw.stylus != null) {
            return raw.stylus
        }
        return super.rawValue(node, prop)
    }

    rawPlain(node, own, detect) {
        if (node.postfix && own === "before") {
            return ""
        }
        stylus: if (own) {
            const isDeclBetween = own === "between" && node.type === "decl"
            if (isDeclBetween && isObjectProperty(node)) {
                break stylus
            }

            const stylusProp = `stylus${own[0].toUpperCase()}${own.slice(1)}`
            if (node.raws[stylusProp] != null) {
                const rawValue = node.raws[stylusProp]
                if (isDeclBetween && isPythonic(node.parent)) {
                    // Adjust multiline between
                    return escapeLinebreak(rawValue)
                }
                return rawValue
            }
        }
        return super.raw(node, own, detect)
    }

    /* eslint-disable complexity -- X( */
    /**
     * Get indent text
     * @param {*} node
     */
    getIndent(node) {
        /* eslint-enable complexity -- X( */
        if (!node.parent) {
            // root
            return ""
        }
        if (node.postfix) {
            return this.getIndent(node.nodes[0])
        }
        let childTarget = node
        let parentTarget = childTarget.parent
        while (parentTarget.postfix) {
            childTarget = parentTarget
            parentTarget = childTarget.parent
        }
        if (isNeedAdjustIndent(node)) {
            const firstSibling =
                parentTarget.nodes.find((n) => n.type !== "comment") ||
                // all comments
                parentTarget.nodes[0]
            if (firstSibling !== childTarget) {
                return this.getIndent(firstSibling)
            }
        }
        const spaces = this.rawPlain(node, "before")
        if (parentTarget.type === "root") {
            if (parentTarget.first === childTarget) {
                return /[^\S\n\r]*$/u.exec(spaces)[0]
            }
        }
        const r = /(?:\r\n|\r|\n)([^\S\n\r]*)$/u.exec(spaces)

        const parentIndent = this.getIndent(parentTarget)
        if (r) {
            // check
            if (
                parentTarget.type === "root" ||
                parentIndent.length < r[1].length
            ) {
                return r[1]
            }
        }
        let parent2Target = parentTarget.parent
        while (parent2Target && parent2Target.postfix) {
            parent2Target = parent2Target.parent
        }

        const parent2Indent =
            (parent2Target && this.getIndent(parent2Target)) || ""

        if (!parent2Indent) {
            return `${parentIndent}${parentIndent || DEFAULT_INDENT}`
        }
        if (parentIndent.startsWith(parent2Indent)) {
            return `${parentIndent}${
                parentIndent.slice(parent2Indent.length) || DEFAULT_INDENT
            }`
        }
        return `${parentIndent}${
            " ".repeat(
                Math.max(parentIndent.length - parent2Indent.length, 0),
            ) || DEFAULT_INDENT
        }`
    }
}
