import { A, BLOCK_SIZE, C, PI, TAU } from "./const";

/** Addition of two 512 bit numbers */
export const add512 = (a: Uint8Array, b: Uint8Array): Uint8Array => {
    const result = new Uint8Array(BLOCK_SIZE)
    let carry = 0;
    for (let i = 63; i >= 0; i--) {
        const sum = a[i] + b[i] + carry;
        result[i] = sum & 0xFF;
        carry = sum >> 8;
    }

    return result
}

/**
 * `X`-transformation.
 * The input of the `X` function is two sequences, each 512 bits long,
 * and the output of the function is the XOR of these two sequences.
 */
export const transformX = (a: Uint8Array, b: Uint8Array): Uint8Array => {
    const result = new Uint8Array(BLOCK_SIZE)
    for (let i = 0; i < BLOCK_SIZE; i++) {
        result[i] = a[i] ^ b[i];
    }

    return result
}

/**
 * `S`-transformation.
 * The `S` function is a regular substitution function. Each byte of the
 * 512-bit input sequence is replaced by the corresponding byte from
 * the `PI` substitution table.
 */
export const transformS = (input: Uint8Array): Uint8Array => {
    const result = new Uint8Array(BLOCK_SIZE)
    for (let i = 0; i < BLOCK_SIZE; i++) {
        result[i] = PI[input[i]];
    }

    return result
}

/**
 * `P`-transformation.
 * Permutation function. For each pair of bytes from the input sequence,
 * one byte is replaced by another.
 */
export const transformP = (input: Uint8Array): Uint8Array => {
    const result = new Uint8Array(BLOCK_SIZE)
    for (let i = 0; i < BLOCK_SIZE; i++) {
        result[i] = input[TAU[i]];
    }

    return result
}

/**
 * `L`-transformation.
 * Represents the multiplication of a 64-bit input vector by a 64x64 binary matrix `A`.
 */
export const transformL = (result: Uint8Array): Uint8Array => {
    const input = new BigUint64Array(8);
    for (let i = 0; i < 8; i++) {
        let value = 0n;
        for (let j = 0; j < 8; j++) {
            value = (value << 8n) | BigInt(result[i*8 + j]);
        }
        input[i] = value;
    }

    const output = new BigUint64Array(8);
    for (let i = 0; i < 8; i++) {
        output[i] = 0n;
        for (let j = 0; j < BLOCK_SIZE; j++) {
            if ((input[i] >> BigInt(63 - j)) & 1n) {
                output[i] ^= A[j];
            }
        }
    }

    const buffer = new Uint8Array(BLOCK_SIZE);
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            buffer[i*8 + j] = Number((output[i] >> BigInt((7-j)*8)) & 0xFFn);
        }
    }

    return buffer
}

/**
 * XSPL-algorithm.
 * Round key calculation function.
 * 
 * 1. `X` - Addition modulo 2;
 * 2. `S` - Substitution;
 * 3. `P` - Permutation;
 * 4. `L` - Linear transformation
 */
export const keySchedule = (keys: Uint8Array, iterIndex: number): Uint8Array => {
    const c = new Uint8Array(C[iterIndex]);
    return transformL(transformP(transformS(transformX(keys, c))))
}

/**
 * `E`-transformation.
 * Part of compression function.
 */
export const transformE = (keys: Uint8Array, block: Uint8Array): Uint8Array => {
    let result: Uint8Array = new Uint8Array(BLOCK_SIZE)
    result = transformX(block, keys)
    
    for (let i = 0; i < 12; i++) {
        keys = keySchedule(keys, i);
        result = transformX(transformL(transformP(transformS(result))), keys)
    }
    
    return result
}

/**
 * Compression function `G` aka XSPLEXX-algorithm
 */
export const transformG = (n: Uint8Array, hash: Uint8Array, message: Uint8Array): Uint8Array => {
    let temp: Uint8Array = new Uint8Array(BLOCK_SIZE);
    let keys = transformL(transformP(transformS(transformX(n, hash))))
    temp = transformX(transformE(keys, message), hash.subarray());

    return transformX(temp, message)
}