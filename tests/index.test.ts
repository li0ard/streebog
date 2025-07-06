import { expect, test, describe } from "bun:test"
import { Streebog256, Streebog512, streebog256, streebog512 } from "../src"
import { randomBytes } from "crypto"

describe("Test symmetric", () => {
    let chunks: Buffer[] = []
    for(let i = 0; i < 10; i++) {
        chunks.push(randomBytes(10))
    }
    
    test("256 bit", () => {
        let m = new Streebog256()
        for(let i of chunks) {
            m.update(i)
        }
        expect(m.digest()).toStrictEqual(streebog256(Buffer.concat(chunks)))
    })
    test("512 bit", () => {
        let m = new Streebog512()
        for(let i of chunks) {
            m.update(i)
        }
        expect(m.digest()).toStrictEqual(streebog512(Buffer.concat(chunks)))
    })
})

describe("Test clone", () => {
    test("256 bit", () => {
        let m = new Streebog256()
        m.update(Buffer.from("foo"))
        let c = m.clone()
        m.update(Buffer.from("bar"))
        c.update(Buffer.from("bar"))
        expect(c.digest()).toStrictEqual(m.digest())
    })

    test("512 bit", () => {
        let m = new Streebog512()
        m.update(Buffer.from("foo"))
        let c = m.clone()
        m.update(Buffer.from("bar"))
        c.update(Buffer.from("bar"))
        expect(c.digest()).toStrictEqual(m.digest())
    })
})

test("Tests from RFC 6986", () => {
    let test_vectors = [
        ["323130393837363534333231303938373635343332313039383736353433323130393837363534333231303938373635343332313039383736353433323130", ["00557be5e584fd52a449b16b0251d05d27f94ab76cbaa6da890b59d8ef1e159d", "486f64c1917879417fef082b3381a4e211c324f074654c38823a7b76f830ad00fa1fbae42b1285c0352f227524bc9ab16254288dd6863dccd5b9f54a1ad0541b"]],
        // CP-1251 encoded message "Се ветри, Стрибожи внуци, веютъ с моря стрелами на храбрыя плъкы Игоревы"
        ["fbe2e5f0eee3c820fbeafaebef20fffbf0e1e0f0f520e0ed20e8ece0ebe5f0f2f120fff0eeec20f120faf2fee5e2202ce8f6f3ede220e8e6eee1e8f0f2d1202ce8f0f2e5e220e5d1", ["508f7e553c06501d749a66fc28c6cac0b005746d97537fa85d9e40904efed29d", "28fbc9bada033b1460642bdcddb90c3fb3e56c497ccd0f62b8a2ad4935e85f037613966de4ee00531ae60f3b5a47f8dae06915d5f2f194996fcabf2622e6881e"]],
    ]

    /**
     * The main problem with GOST is the lack of a standardized byte order.
     * RFC 6986 uses Little-Endian, while implementation uses Big-Endian.
     * (and this isn't only case with my implementation)
     * Therefore, it's necessary to reverse input data and result.
     */

    for(let [input, results] of test_vectors) {
       let result256 = Buffer.from(streebog256(Buffer.from(input as string, "hex").reverse())).reverse()
       let result512 = Buffer.from(streebog512(Buffer.from(input as string, "hex").reverse())).reverse()
       expect(result256.toString("hex")).toBe(results[0])
       expect(result512.toString("hex")).toBe(results[1])
    }
})

test("Test from Habr article", () => {
    let test_vector = Buffer.from("d0cf11e0a1b11ae1000000000000000000000000000000003e000300feff0900060000000000000000000000010000000100000000000000001000002400000001000000feffffff0000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", "hex")
    let expected = "c766085540caaa8953bfcf7a1ba220619cee50d65dc242f82f23ba4b180b18e0"

    expect(Buffer.from(streebog256(test_vector)).toString("hex")).toBe(expected)
})

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