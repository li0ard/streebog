import { expect, test, describe } from "bun:test"
import { Streebog256HMAC, Streebog512HMAC } from "../src"

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