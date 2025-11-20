import { A, BLOCKSIZE, C, PI, TAU } from "./const.js";

/** XOR two Uint8Array arrays */
export const xor = (a: Uint8Array, b: Uint8Array) => {
    let mlen = Math.min(a.length, b.length);
    let result = new Uint8Array(mlen);
    for(let i = 0; i < mlen; i++) result[i] = a[i] ^ b[i];

    return result.slice();
}


/** Addition of two 512 bit numbers */
export const add512 = (a: Uint8Array, b: Uint8Array): Uint8Array => {
    const c: Uint8Array = new Uint8Array(64);
    const tmpA: Uint8Array = new Uint8Array(64);
    const tmpB: Uint8Array = new Uint8Array(64);

    for (let i = 0; i < a.length; i++) tmpA[63 - i] = a[a.length - i - 1];
    for (let i = 0; i < b.length; i++) tmpB[63 - i] = b[b.length - i - 1];
    for (let i = 63, tmp = 0; i >= 0; i--) {
        tmp = tmpA[i] + tmpB[i] + (tmp >> 8);
        c[i] = tmp & 0xff;
    }

    return c;
}

/**
 * `S`-transformation.
 * The `S` function is a regular substitution function. Each byte of the
 * 512-bit input sequence is replaced by the corresponding byte from
 * the `PI` substitution table.
 */
export const transformS = (input: Uint8Array): Uint8Array => {
    const result = new Uint8Array(BLOCKSIZE);
    for (let i = 0; i < BLOCKSIZE; i++) result[i] = PI[input[i]];

    return result;
}

/**
 * `P`-transformation.
 * Permutation function. For each pair of bytes from the input sequence,
 * one byte is replaced by another.
 */
export const transformP = (input: Uint8Array): Uint8Array => {
    const result = new Uint8Array(BLOCKSIZE);
    for (let i = 0; i < BLOCKSIZE; i++) result[i] = input[TAU[i]];

    return result;
}

/**
 * `L`-transformation.
 * Represents the multiplication of a 64-bit input vector by a 64x64 binary matrix `A`.
 */
export const transformL = (input: Uint8Array): Uint8Array => {
    const result: Uint8Array = new Uint8Array(BLOCKSIZE);

    for (let i = 0; i < 8; i++) {
        const parts: Uint32Array = new Uint32Array(2);
        const tmp: Uint8Array = input.slice(i * 8, i * 8 + 8).reverse();

        for (let j = 0; j < 8; j++) {
            for (let k = 0; k < 8; k++) {
                if ((tmp[7 - j] >> 7 - k) & 1) {
                    parts[0] ^= A[j * 16 + k * 2];
                    parts[1] ^= A[j * 16 + k * 2 + 1];
                }
            }
        }

        result[i * 8] = parts[0] >> 24;
        result[i * 8 + 1] = (parts[0] << 8) >> 24;
        result[i * 8 + 2] = (parts[0] << 16) >> 24;
        result[i * 8 + 3] = (parts[0] << 24) >> 24;
        result[i * 8 + 4] = parts[1] >> 24;
        result[i * 8 + 5] = (parts[1] << 8) >> 24;
        result[i * 8 + 6] = (parts[1] << 16) >> 24;
        result[i * 8 + 7] = (parts[1] << 24) >> 24;
    }

    return result;
}

/**
 * `E`-transformation.
 * Part of compression function.
 */
export const transformE = (block: Uint8Array, keys: Uint8Array): Uint8Array => {
    let c: Uint8Array = xor(block, keys);
    for (let i = 0; i < 12; i++) {
        block = transformL(transformP(transformS(xor(block, C[i]))));
        c = xor(transformL(transformP(transformS(c))), block);
    }

    return c;
}

/** Compression function `G` aka XSPLEXX-algorithm */
export const transformG = (hash: Uint8Array, n: Uint8Array, message: Uint8Array): Uint8Array => {
    return xor(xor(transformE(transformL(transformP(transformS(xor(n, hash)))), message), n), message);
}

const asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 } as const;
function asciiToBase16(ch: number): number | undefined {
    if (ch >= asciis._0 && ch <= asciis._9) return ch - asciis._0; // '2' => 50-48
    if (ch >= asciis.A && ch <= asciis.F) return ch - (asciis.A - 10); // 'B' => 66-(65-10)
    if (ch >= asciis.a && ch <= asciis.f) return ch - (asciis.a - 10); // 'b' => 98-(97-10)
    return;
}
/** Convert hex to bytes */
export function hexToBytes(hex: string): Uint8Array {
    if (typeof hex !== 'string') throw new Error('hex string expected, got ' + typeof hex);
    const hl = hex.length;
    const al = hl / 2;
    if (hl % 2) throw new Error('hex string expected, got unpadded hex of length ' + hl);
    const array = new Uint8Array(al);
    for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
        const n1 = asciiToBase16(hex.charCodeAt(hi));
        const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
        if (n1 === undefined || n2 === undefined) {
            const char = hex[hi] + hex[hi + 1];
            throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
        }
        array[ai] = n1 * 16 + n2; // multiply first octet, e.g. 'a3' => 10*16+3 => 160 + 3 => 163
    }
    return array;
}

/** Convert number to bytes (Big-Endian) */
export function numberToBytesBE(n: number | bigint, len: number): Uint8Array {
    let num = n.toString(16).padStart(len * 2, '0');
    while (num.length % 2 != 0) num = "0" + num;
    return hexToBytes(num);
}

const getPadLength = (dataLength: number): number => {
    if(dataLength < BLOCKSIZE) return BLOCKSIZE - dataLength;
    if(dataLength % BLOCKSIZE == 0) return 0;
    return BLOCKSIZE - dataLength % BLOCKSIZE;
}

/** Padding for blocks */
export const pad = (data: Uint8Array): Uint8Array => {
    const padded = new Uint8Array(data.length + getPadLength(data.length));
    padded.set(data);
    return padded;
}
