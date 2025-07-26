import { expect, test, describe } from "bun:test"
import { Streebog512PBKDF2 } from "../src"

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