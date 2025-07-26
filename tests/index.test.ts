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

describe("RFC 6986", () => {
    /**
     * The main problem with GOST is the lack of a standardized byte order.
     * RFC 6986 uses Little-Endian, while implementation uses Big-Endian.
     * (and this isn't only case with my implementation)
     * Therefore, it's necessary to reverse input data and result.
     */
    let test_vectors = [
        ["323130393837363534333231303938373635343332313039383736353433323130393837363534333231303938373635343332313039383736353433323130", ["00557be5e584fd52a449b16b0251d05d27f94ab76cbaa6da890b59d8ef1e159d", "486f64c1917879417fef082b3381a4e211c324f074654c38823a7b76f830ad00fa1fbae42b1285c0352f227524bc9ab16254288dd6863dccd5b9f54a1ad0541b"]],
        // CP-1251 encoded message "Се ветри, Стрибожи внуци, веютъ с моря стрелами на храбрыя плъкы Игоревы"
        ["fbe2e5f0eee3c820fbeafaebef20fffbf0e1e0f0f520e0ed20e8ece0ebe5f0f2f120fff0eeec20f120faf2fee5e2202ce8f6f3ede220e8e6eee1e8f0f2d1202ce8f0f2e5e220e5d1", ["508f7e553c06501d749a66fc28c6cac0b005746d97537fa85d9e40904efed29d", "28fbc9bada033b1460642bdcddb90c3fb3e56c497ccd0f62b8a2ad4935e85f037613966de4ee00531ae60f3b5a47f8dae06915d5f2f194996fcabf2622e6881e"]],
    ]

    test("256 bit", () => {
        for(let [input, results] of test_vectors) {
            let result = streebog256(Buffer.from(input as string, "hex").reverse())
            expect(result).toStrictEqual(Buffer.from(results[0], "hex").reverse())
        }
    })

    test("512 bit", () => {
        for(let [input, results] of test_vectors) {
            let result = streebog512(Buffer.from(input as string, "hex").reverse())
            expect(result).toStrictEqual(Buffer.from(results[1], "hex").reverse())
        }
    })
})