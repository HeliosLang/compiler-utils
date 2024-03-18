/**
 * @param {string} raw
 * @returns {string}
 */
export function removeTrailingWhitespace(raw) {
    const lines = raw.split("\n")

    /**
     * @type {string[]}
     */
    let cleanLines = []

    let prevLine = ""
    for (let line of lines) {
        line = line.trimEnd()

        if (prevLine != "" || line != "") {
            cleanLines.push(line)
        }

        prevLine = line
    }

    if (cleanLines.length == 0 || cleanLines[cleanLines.length - 1] != "") {
        cleanLines.push("")
    }

    return cleanLines.join("\n")
}
