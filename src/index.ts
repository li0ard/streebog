import { BLOCK_SIZE } from "./const";
import { transformG, add512, numberToBytesBE } from "./utils";
import { HMAC } from "@noble/hashes/hmac";
import { concatBytes, createHasher, type Hash } from "@noble/hashes/utils";

/**
 * Streebog core class
 */
export class Streebog {
    public readonly blockLen: number = BLOCK_SIZE
    public is512: boolean;
    public buffer: Uint8Array = new Uint8Array(BLOCK_SIZE);
    public bufferLength: number = 0;
    public hash: Uint8Array = new Uint8Array(BLOCK_SIZE);
    public n: Uint8Array = new Uint8Array(BLOCK_SIZE);
    public sigma: Uint8Array = new Uint8Array(BLOCK_SIZE);    

    /**
     * Streebog core class
     * @param is512 Use 512 bits version of algorithm
     */
    constructor(is512: boolean) {
        this.is512 = is512;
        this.reset();
    }

    /** Reset hash state */
    reset() {
        this.buffer = new Uint8Array(BLOCK_SIZE);
        this.bufferLength = 0;
        this.hash = new Uint8Array(BLOCK_SIZE).fill(this.is512 ? 0 : 1);
        this.n = new Uint8Array(BLOCK_SIZE);
        this.sigma = new Uint8Array(BLOCK_SIZE);
    }
    /** Reset hash state */
    destroy() {
        this.reset()
    }

    /** Update hash buffer */
    update(data: Uint8Array): this {
        let offset = 0;

        if (this.bufferLength > 0) {
            const needed = BLOCK_SIZE - this.bufferLength;
            const available = Math.min(needed, data.length);
            
            this.buffer.set(data.subarray(0, available), this.bufferLength);
            this.bufferLength += available;
            offset = available;

            if (this.bufferLength === BLOCK_SIZE) {
                this.processBlock(this.buffer, BLOCK_SIZE);
                this.bufferLength = 0;
            }
        }

        while (offset + BLOCK_SIZE <= data.length) {
            const block = data.subarray(offset, offset + BLOCK_SIZE);
            this.processBlock(block, BLOCK_SIZE);
            offset += BLOCK_SIZE;
        }

        if (offset < data.length) {
            const remaining = data.subarray(offset);
            this.buffer.set(remaining, 0);
            this.bufferLength = remaining.length;
        }

        return this
    }

    private processBlock(chunk: Uint8Array, chunkLength: number) {
        const block = new Uint8Array(BLOCK_SIZE);
        block.set(chunk.subarray(0, chunkLength));

        if (chunkLength < BLOCK_SIZE) {
            block[chunkLength] = 1;
        }

        const blockReversed = block.slice();
        blockReversed.reverse();

        const sizeBits = chunkLength * 8;
        const blockSize = new Uint8Array(BLOCK_SIZE);
        blockSize[62] = (sizeBits >> 8) & 0xFF;
        blockSize[63] = sizeBits & 0xFF;

        this.hash = transformG(this.n, this.hash, blockReversed);
        this.n = add512(this.n, blockSize);
        this.sigma = add512(this.sigma, blockReversed);
    }


    /**
     * Finalize hash computation and write result into Uint8Array
     * @param buf - Output Uint8Array
     */
    digestInto(buf: Uint8Array): Uint8Array {
        let finalHash: Uint8Array = this.hash.slice();
        let finalN: Uint8Array = this.n.slice();
        let finalSigma: Uint8Array = this.sigma.slice();

        if (this.bufferLength > 0) {
            const block = new Uint8Array(BLOCK_SIZE);
            block.set(this.buffer.subarray(0, this.bufferLength));
            block[this.bufferLength] = 1;

            const blockReversed = block.slice();
            blockReversed.reverse();

            const sizeBits = this.bufferLength * 8;
            const blockSize = new Uint8Array(BLOCK_SIZE);
            blockSize[62] = (sizeBits >> 8) & 0xFF;
            blockSize[63] = sizeBits & 0xFF;

            finalHash = transformG(finalN, finalHash, blockReversed);
            finalN = add512(finalN, blockSize);
            finalSigma = add512(finalSigma, blockReversed);
        }

        const zero = new Uint8Array(BLOCK_SIZE);
        finalHash = transformG(zero, finalHash, finalN);
        finalHash = transformG(zero, finalHash, finalSigma);

        const result: Uint8Array = finalHash.slice().reverse();
        buf.set(this.is512 ? result : result.subarray(32))
        this.reset()
        return buf
    }
}

/**
 * Streebog 256 aka `GOST R 34.11-2012 256 bits`
 * 
 * `@noble/hashes`-like class
 */
export class Streebog256 extends Streebog {
    outputLen: number = 32
    constructor() {
        super(false);
    }

    static create(): Streebog256 {
        return new Streebog256()
    }

    /** Clone hash instance */
    clone(): Streebog256 {
        return this._cloneInto();
    }

    _cloneInto(to?: Streebog256): Streebog256 {
        to ||= new Streebog256()
        to.buffer = this.buffer.slice()
        to.bufferLength = this.bufferLength
        to.hash = this.hash.slice()
        to.n = this.n.slice()
        to.sigma = this.sigma.slice()

        return to
    }

    /**
     * Finalize hash computation and return result as Uint8Array
     */
    digest(): Uint8Array {
        const out = this.digestInto(new Uint8Array(this.outputLen))
        return out
    }
}

/**
 * Streebog 512 bit aka `GOST R 34.11-2012 512 bits`
 */
export class Streebog512 extends Streebog {
    outputLen: number = 64
    constructor() {
        super(true);
    }

    static create(): Streebog512 {
        return new Streebog512()
    }

    /** Clone hash instance */
    clone(): Streebog512 {
        return this._cloneInto();
    }

    _cloneInto(to?: Streebog512): Streebog512 {
        to ||= new Streebog512()
        to.buffer = this.buffer.slice()
        to.bufferLength = this.bufferLength
        to.hash = this.hash.slice()
        to.n = this.n.slice()
        to.sigma = this.sigma.slice()

        return to
    }

    /**
     * Finalize hash computation and return result as Uint8Array
     */
    digest(): Uint8Array {
        const out = this.digestInto(new Uint8Array(this.outputLen))
        return out
    }
}

/**
 * Compute hash with `Streebog 256 bit` (aka `GOST R 34.11-2012 256 bits`)
 * @param input Input bytes
 * @returns {Uint8Array}
 */
export const streebog256 = (input: Uint8Array): Uint8Array => new Streebog256().update(input).digest();

/**
 * Compute hash with `Streebog 512 bit` (aka `GOST R 34.11-2012 512 bits`)
 * @param input Input bytes
 * @returns {Uint8Array}
 */
export const streebog512 = (input: Uint8Array): Uint8Array => new Streebog512().update(input).digest();

/**
 * HMAC with Streebog 256
 * @param key Encryption key
 */
export const Streebog256HMAC = (key: Uint8Array): HMAC<Hash<Streebog256>> => {
    return new HMAC(createHasher(Streebog256.create), key)
}

/**
 * KDF_GOSTR3411_2012_256
 * @param key Initial key
 * @param label Label
 * @param seed Seed
 */
export const kdf_gostr3411_2012_256 = (key: Uint8Array, label: Uint8Array, seed: Uint8Array): Uint8Array => {
    return Streebog256HMAC(key).update(concatBytes(
        new Uint8Array([0x01]),
        label,
        new Uint8Array([0x00]),
        seed,
        new Uint8Array([0x01, 0x00])
    )).digest()
}

/**
 * KDF_TREE_GOSTR3411_2012_256
 * @param key Initial key
 * @param label Label
 * @param seed Seed
 * @param keys Number of generated keys
 * @param i_len Length of iterations value (`R`)
 */
export const kdf_tree_gostr3411_2012_256 = (key: Uint8Array, label: Uint8Array, seed: Uint8Array, keys: number, i_len: number = 1): Uint8Array[] => {
    let keymat: Uint8Array[] = []
    let _len = numberToBytesBE(BigInt(keys) * 32n * 8n, 1)

    for(let i = 0; i < keys; i++) {
        keymat.push(Streebog256HMAC(key).update(concatBytes(
            numberToBytesBE(i + 1, i_len),
            label,
            new Uint8Array([0x00]),
            seed,
            _len
        )).digest())
    }

    return keymat
}

export * from "./utils"
export * from "./const"