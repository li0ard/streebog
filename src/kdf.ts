import { concatBytes, hexToBytes, numberToBytesBE } from "@li0ard/gost3413/dist/utils"
import { Streebog256HMAC } from "./index"

/**
 * `KDF_GOSTR3411_2012_256`
 * 
 * @param key Initial key
 * @param label Label
 * @param seed Seed
 */
export const kdf_gostr3411_2012_256 = (key: Uint8Array, label: Uint8Array, seed: Uint8Array): Uint8Array => {
    return Streebog256HMAC(key).update(concatBytes(hexToBytes("01"), label, hexToBytes("00"), seed, hexToBytes("0100"))).digest();
    // Also we can use:
    // return kdf_tree_gostr3411_2012_256(key, label, seed, 1)[0]
}

/**
 * `KDF_TREE_GOSTR3411_2012_256`
 * 
 * @param key Initial key
 * @param label Label
 * @param seed Seed
 * @param keys Number of generated keys
 * @param i_len Length of iterations value (`R`)
 */
export const kdf_tree_gostr3411_2012_256 = (key: Uint8Array, label: Uint8Array, seed: Uint8Array, keys: number, i_len: number = 1): Uint8Array[] => {
    let keymat: Uint8Array[] = [];
    let length = numberToBytesBE(BigInt(keys) * 32n * 8n, 1);

    for(let i = 0; i < keys; i++) {
        keymat.push(Streebog256HMAC(key).update(concatBytes(numberToBytesBE(i + 1, i_len), label, hexToBytes("00"), seed, length)).digest());
    }

    return keymat;
}