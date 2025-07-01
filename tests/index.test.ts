import { expect, test } from "bun:test"
import { streebog256, streebog512 } from "../src"

test("Streebog 256 bit", () => {
    let test_vectors = [
        ["hello world", "c600fd9dd049cf8abd2f5b32e840d2cb0e41ea44de1c155dcd88dc84fe58a855"],
        ["hello world\n", "f72018189a5cfb803dbe1f2149cf554c40093d8e7f81c21e08ac5bcd09d9934d"],
        ["привет мир\n", "a0376666db844555aa12daa03509b5d67ff474199be6bc33c7decbb9f8fbc32d"],
        ["Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n", "3e8e391bbc40e3600f87ddcb27eb7a839189567c5ed4fa6fe4341b424e7701b1"],
    ]

    for(let i of test_vectors) {
        let result = Buffer.from(streebog256(Buffer.from(i[0])))
        expect(result.toString("hex")).toBe(i[1])
    }
})

test("Streebog 512 bit", () => {
    let test_vectors = [
        ["hello world", "84d883ede9fa6ce855d82d8c278ecd9f5fc88bf0602831ae0c38b9b506ea3cb02f3fa076b8f5664adf1ff862c0157da4cc9a83e141b738ff9268a9ba3ed6f563"],
        ["hello world\n", "9d295fa56ebe77b83db37832685ce874c43a5add7afc5f1aaa94ca21b12a12897a48bb3dbbe20cd9cfafa22a6e3c82eb4c6503109bfb0b4514c7bc27e69ec120"],
        ["привет мир\n", "b6ef672fd3472126a3b6ec6be9e445bb66d1a53361196bfb16a85ff2f9469d8ea5182d6a24601f2518b9176d57be3462063e2d90ab4ec1a6a6d92aaf2db773a2"],
        ["Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n", "81b234593656f04ee1bc471af2cc269895c7aded3c8d5d818a18c537894bd61c2db1a4e66ff00d33fb7d2d195202984cade76b7c0ab3de8b9d61a2541c040591"],
    ]

    for(let i of test_vectors) {
        let result = Buffer.from(streebog512(Buffer.from(i[0])))
        expect(result.toString("hex")).toBe(i[1])
    }
})