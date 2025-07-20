import { expect, test, describe } from "bun:test"
import { Streebog256, Streebog256HMAC, Streebog512, Streebog512HMAC, Streebog512PBKDF2, kdf_gostr3411_2012_256, kdf_tree_gostr3411_2012_256, streebog256, streebog512 } from "../src"
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

describe("PBKDF2", () => {
    test("#1", () => {
        const expected = Buffer.from("64770af7f748c3b1c9ac831dbcfd85c26111b30a8a657ddc3056b80ca73e040d2854fd36811f6d825cc4ab66ec0a68a490a9e5cf5156b3a2b7eecddbf9a16b47", "hex")
        expect(Streebog512PBKDF2(Buffer.from("password"), Buffer.from("salt"), 1, 64)).toStrictEqual(expected)
    })
    test("#2", () => {
        const expected = Buffer.from("5a585bafdfbb6e8830d6d68aa3b43ac00d2e4aebce01c9b31c2caed56f0236d4d34b2b8fbd2c4e89d54d46f50e47d45bbac301571743119e8d3c42ba66d348de", "hex")
        expect(Streebog512PBKDF2(Buffer.from("password"), Buffer.from("salt"), 2, 64)).toStrictEqual(expected)
    })
})

describe("HMAC", () => {
    let key = Buffer.from("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f", "hex")
    let msg = Buffer.from("0126bdb87800af214341456563780100", "hex")
    test("256 bit", () => {
        const expected = Buffer.from("a1aa5f7de402d7b3d323f2991c8d4534013137010a83754fd0af6d7cd4922ed9", "hex")
        let a = Streebog256HMAC(key)
        a.update(msg)
        expect(a.digest()).toStrictEqual(expected)
    })

    test("512 bit", () => {
        const expected = Buffer.from("a59bab22ecae19c65fbde6e5f4e9f5d8549d31f037f9df9b905500e171923a773d5f1530f2ed7e964cb2eedc29e9ad2f3afe93b2814f79f5000ffc0366c251e6", "hex")
        let a = Streebog512HMAC(key)
        a.update(msg)
        expect(a.digest()).toStrictEqual(expected)
    })
})

describe("KDF", () => {
    test("kdf_gostr3411_2012_256", () => {
        const expected = Buffer.from("a1aa5f7de402d7b3d323f2991c8d4534013137010a83754fd0af6d7cd4922ed9", "hex")
        let result = kdf_gostr3411_2012_256(
            Buffer.from("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f", "hex"),
            Buffer.from("26bdb878", "hex"),
            Buffer.from("af21434145656378", "hex")
        )
        expect(result).toStrictEqual(expected)
    })

    test("kdf_tree_gostr3411_2012_256", () => {
        const expected = Buffer.from("22b6837845c6bef65ea71672b265831086d3c76aebe6dae91cad51d83f79d16b", "hex")
        const expected2 = Buffer.from("074c9330599d7f8d712fca54392f4ddde93751206b3584c8f43f9e6dc51531f9", "hex")
        let result = kdf_tree_gostr3411_2012_256(
            Buffer.from("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f", "hex"),
            Buffer.from("26bdb878", "hex"),
            Buffer.from("af21434145656378", "hex"),
            2
        )
        expect(result[0]).toStrictEqual(expected)
        expect(result[1]).toStrictEqual(expected2)
    })
})