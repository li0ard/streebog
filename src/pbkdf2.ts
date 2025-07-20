import { pbkdf2 } from "@noble/hashes/pbkdf2"
import { createHasher } from "@noble/hashes/utils"
import { Streebog512 } from "./index"

/**
 * PBKDF2 implementation for GOST R 34.11-2012
 * @param password Password from which a derived key is generated
 * @param salt Salt
 * @param iterations Number of iterations (aka work factor)
 * @param dkLen Output length
 */
export const Streebog512PBKDF2 = (password: Uint8Array, salt: Uint8Array, iterations: number, dkLen: number): Uint8Array => {
    return pbkdf2(createHasher(Streebog512.create), password, salt, { dkLen, c: iterations })
}