import { expect, test, describe } from "bun:test"
import { kdf_gostr3411_2012_256, kdf_tree_gostr3411_2012_256 } from "../src"

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