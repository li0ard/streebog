import { A, C, PI, TAU } from "./const";

/** Addition of two 512 bit numbers */
const add512 = (a: Uint8Array, b: Uint8Array, result: Uint8Array) => {
    let carry = 0;
    for (let i = 63; i >= 0; i--) {
        const sum = a[i] + b[i] + carry;
        result[i] = sum & 0xFF;
        carry = sum >> 8;
    }
}

/**
 * `X`-transformation.
 * The input of the `X` function is two sequences, each 512 bits long,
 * and the output of the function is the XOR of these two sequences.
 */
const transformX = (a: Uint8Array, b: Uint8Array, result: Uint8Array) => {
    for (let i = 0; i < 64; i++) {
        result[i] = a[i] ^ b[i];
    }
}

/**
 * `S`-transformation.
 * The `S` function is a regular substitution function. Each byte of the
 * 512-bit input sequence is replaced by the corresponding byte from
 * the `PI` substitution table.
 */
const transformS = (result: Uint8Array) => {
    for (let i = 0; i < 64; i++) {
        result[i] = PI[result[i]];
    }
}

/**
 * `P`-transformation.
 * Permutation function. For each pair of bytes from the input sequence,
 * one byte is replaced by another.
 */
const transformP = (result: Uint8Array) => {
    const temp = new Uint8Array(result);
    for (let i = 0; i < 64; i++) {
        result[i] = temp[TAU[i]];
    }
}

/**
 * `L`-transformation.
 * Represents the multiplication of a 64-bit input vector by a 64x64 binary matrix `A`.
 */
const transformL = (result: Uint8Array) => {
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
        for (let j = 0; j < 64; j++) {
            if ((input[i] >> BigInt(63 - j)) & 1n) {
                output[i] ^= A[j];
            }
        }
    }

    const buffer = new Uint8Array(64);
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            buffer[i*8 + j] = Number((output[i] >> BigInt((7-j)*8)) & 0xFFn);
        }
    }

    result.set(buffer);
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
const keySchedule = (keys: Uint8Array, iterIndex: number) => {
    const c = new Uint8Array(C[iterIndex]);
    const temp = new Uint8Array(64);

    transformX(keys, c, temp);
    transformS(temp);
    transformP(temp);
    transformL(temp);

    keys.set(temp);
}

/**
 * `E`-transformation.
 * Part of compression function.
 */
const transformE = (keys: Uint8Array, block: Uint8Array, state: Uint8Array) => {
    transformX(block, keys, state);
    
    for (let i = 0; i < 12; i++) {
        transformS(state);
        transformP(state);
        transformL(state);
        keySchedule(keys, i);
        const temp = new Uint8Array(state);
        transformX(temp, keys, state);
    }
}

/**
 * Compression function `G` aka XSPLEXX-algorithm
 */
const transformG = (n: Uint8Array, hash: Uint8Array, message: Uint8Array) => {
    const keys = new Uint8Array(64);
    const temp = new Uint8Array(64);
    
    transformX(n, hash, keys);
    transformS(keys);
    transformP(keys);
    transformL(keys);
    transformE(keys, message, temp);
    transformX(temp, hash, temp);
    transformX(temp, message, hash);
}

/**
 * Core function for both algorithms
 */
const streebogCore = (message: Uint8Array, hash: Uint8Array) => {
    const n = new Uint8Array(64);
    const sigma = new Uint8Array(64);
    const blockSize = new Uint8Array(64);
    const zero = new Uint8Array(64);

    for (let offset = 0; offset < message.length; offset += 64) {
        const chunk = message.subarray(offset, offset + 64);
        const block = new Uint8Array(64);

        block.set(chunk);

        if (chunk.length < 64) {
            block[chunk.length] = 1;
        }

        const blockReversed = new Uint8Array(block.buffer.slice(0));
        blockReversed.reverse();

        const sizeBits = chunk.length * 8;
        blockSize[62] = (sizeBits >> 8) & 0xFF;
        blockSize[63] = sizeBits & 0xFF;

        transformG(n, hash, blockReversed);
        add512(n, blockSize, n);
        add512(sigma, blockReversed, sigma);
    }

    transformG(zero, hash, n);
    transformG(zero, hash, sigma);

    hash.reverse();
}

/**
 * Compute hash with `Streebog 256 bit` (aka `GOST R 34.11-2012 256 bits`)
 * @param input Input bytes
 * @returns {Uint8Array}
 */
export const streebog256 = (input: Uint8Array): Uint8Array => {
    const hash = new Uint8Array(64).fill(1);
    streebogCore(input, hash);
    return hash.subarray(32);
}

/**
 * Compute hash with `Streebog 512 bit` (aka `GOST R 34.11-2012 512 bits`)
 * @param input Input bytes
 * @returns {Uint8Array}
 */
export const streebog512 = (input: Uint8Array): Uint8Array => {
    const hash = new Uint8Array(64);
    streebogCore(input, hash);
    return hash;
}