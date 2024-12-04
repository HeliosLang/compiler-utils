import { strictEqual } from "node:assert"
import { describe, it } from "node:test"
import { removeTrailingWhitespace } from "./removeTrailingWhitespace.js"
import { translateImportPaths } from "./translateImportPaths.js"

describe(translateImportPaths.name, () => {
    /**
     * @param {string} path
     * @returns {string}
     */
    const src = (
        path
    ) => `testing importPath\nimport { /*weird comment*/ Datum } from ${path}
    
func main(datum: Datum, _, _) -> Bool {
    // single-line comment
    true

    /**
     * Multiline comment
     */
}`

    const input = removeTrailingWhitespace(src('"./relative/path/file.hl"'))

    // care must be taken to remove trailing whitespace
    const expectedOutput = removeTrailingWhitespace(src("MyModule"))

    it("preserves whitespace", () => {
        strictEqual(
            translateImportPaths(input, () => "MyModule").trim(),
            expectedOutput.trim()
        )
    })
})
