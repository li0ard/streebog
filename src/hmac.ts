import { HMAC } from "@noble/hashes/hmac";
import { createHasher, type Hash } from "@noble/hashes/utils";
import { Streebog256, Streebog512 } from "./index";

/**
 * HMAC implementation for Streebog 256 bit
 * @param key Encryption key
 */
export const Streebog256HMAC = (key: Uint8Array): HMAC<Hash<Streebog256>> => {
    return new HMAC(createHasher(Streebog256.create), key);
}

/**
 * HMAC implementation for Streebog 512 bit
 * @param key Encryption key
 */
export const Streebog512HMAC = (key: Uint8Array): HMAC<Hash<Streebog512>> => {
    return new HMAC(createHasher(Streebog512.create), key);
}