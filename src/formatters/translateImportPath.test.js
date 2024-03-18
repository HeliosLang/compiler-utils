import { describe, it } from "node:test"
import { strictEqual } from "node:assert"
import { translateImportPaths } from "./translateImportPaths.js"
import { removeTrailingWhitespace } from "./removeTrailingWhitespace.js"

describe(translateImportPaths.name, () => {
    /**
     * @param {string} path
     * @returns {string}
     */
    const src = (path) => `import { /*weird comment*/ Datum } from ${path}
    
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
