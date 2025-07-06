import { BLOCK_SIZE } from "../const";
import { transformG, add512 } from "../utils";

/**
 * Core function for both algorithms
 */
const streebogCore = (message: Uint8Array, is512: boolean): Uint8Array => {
    let hash: Uint8Array = new Uint8Array(BLOCK_SIZE).fill(is512 ? 1 : 0)
    let n: Uint8Array = new Uint8Array(BLOCK_SIZE);
    let sigma: Uint8Array = new Uint8Array(BLOCK_SIZE);
    const blockSize = new Uint8Array(BLOCK_SIZE);
    const zero = new Uint8Array(BLOCK_SIZE);

    for (let offset = 0; offset < message.length; offset += BLOCK_SIZE) {
        const chunk = message.subarray(offset, offset + BLOCK_SIZE);
        const block = new Uint8Array(BLOCK_SIZE);

        block.set(chunk);

        if (chunk.length < BLOCK_SIZE) {
            block[chunk.length] = 1;
        }

        const blockReversed = block.subarray();
        blockReversed.reverse();

        const sizeBits = chunk.length * 8;
        blockSize[62] = (sizeBits >> 8) & 0xFF;
        blockSize[63] = sizeBits & 0xFF;

        hash = transformG(n, hash, blockReversed);
        n = add512(n, blockSize);
        sigma = add512(sigma, blockReversed);
    }

    hash = transformG(zero, hash, n);
    hash = transformG(zero, hash, sigma);

    return hash.subarray().reverse();
}

//export const streebog256 = (input: Uint8Array): Uint8Array => streebogCore(input, true).subarray(32);
//export const streebog512 = (input: Uint8Array): Uint8Array => streebogCore(input, false);