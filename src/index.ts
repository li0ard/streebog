import { BLOCKSIZE } from "./const";
import { concatBytes } from "@noble/hashes/utils";
import { transformG, add512, pad } from "./utils";

/**
 * Streebog core class
 */
export class Streebog {
    public buffer: Uint8Array;
    public readonly blockLen = BLOCKSIZE;
    public outputLen: number;

    /**
     * Streebog core constructor
     * @param is512 Use 512 bits version of algorithm
     */
    constructor(private is512: boolean) {
        this.buffer = new Uint8Array();
        this.outputLen = is512 ? 64 : 32;
    }

    /** Reset hash state */
    public reset() { this.buffer = new Uint8Array(); }
    /** Reset hash state */
    public destroy() { this.reset(); }

    /** Update hash buffer */
    public update(data: Uint8Array): this {
        this.buffer = concatBytes(this.buffer, data);
        return this;
    }

    /** Finalize hash computation and return result as Uint8Array */
    public digest(): Uint8Array { return this.digestInto(new Uint8Array(this.outputLen)); }

    /**
     * Finalize hash computation and write result into Uint8Array
     * @param buf - Output Uint8Array
     */
    public digestInto(buf: Uint8Array): Uint8Array {
        let message = this.buffer.slice().reverse();
        let n: Uint8Array = new Uint8Array(BLOCKSIZE);
        let sigma: Uint8Array = new Uint8Array(BLOCKSIZE);
        let hash: Uint8Array = new Uint8Array(64).fill(this.is512 ? 0 : 1);

        let blocks: number = 1;
        for (let i = message.length; i >= BLOCKSIZE; i -= BLOCKSIZE) {
            const pos: number = message.length - blocks * BLOCKSIZE;

            hash = transformG(n, hash, message.slice(pos, pos + BLOCKSIZE));
            n = add512(n, new Uint8Array([0, 0, 2, 0]));
            sigma = add512(sigma, message.slice(pos, pos + BLOCKSIZE));
            blocks++;
        }

        let paddedMsg: Uint8Array = new Uint8Array(BLOCKSIZE);
        const msg: Uint8Array = message.slice(0, message.length - (blocks - 1) * 64);
        if (msg.length < BLOCKSIZE) {
            paddedMsg = pad(paddedMsg);

            paddedMsg[BLOCKSIZE - msg.length - 1] = 0x01;
            for (let i = 0; i < msg.length; i++) {
                paddedMsg[BLOCKSIZE - msg.length + i] = msg[i];
            }
        }

        const msgLen: Uint8Array = new Uint8Array(4);
        for (let i = 0; i < 4; i++) msgLen[i] = (msg.length * 8 >> i * 8) & 255;

        hash = transformG(
            new Uint8Array(64),
            transformG(new Uint8Array(64), transformG(n, hash, paddedMsg), add512(n, msgLen.reverse())),
            add512(sigma, paddedMsg)
        );

        if (this.is512) buf.set(hash.slice().reverse());
        else buf.set(hash.slice(0, 32).reverse());
        this.reset()
        return buf
    }
}

/** Streebog 256 aka `GOST R 34.11-2012 256 bits` */
export class Streebog256 extends Streebog {
    /** Streebog 256 aka `GOST R 34.11-2012 256 bits` */
    constructor() { super(false); }
    /** Create hash instance */
    static create(): Streebog256 { return new Streebog256(); }

    /** Clone hash instance */
    clone(): Streebog256 { return this._cloneInto(); }
    _cloneInto(to?: Streebog256): Streebog256 {
        to ||= new Streebog256();
        to.buffer = this.buffer.slice();

        return to;
    }
}

/** Streebog 512 bit aka `GOST R 34.11-2012 512 bits` */
export class Streebog512 extends Streebog {
    /** Streebog 512 bit aka `GOST R 34.11-2012 512 bits` */
    constructor() { super(true); }
    /** Create hash instance */
    static create(): Streebog512 { return new Streebog512(); }

    /** Clone hash instance */
    clone(): Streebog512 { return this._cloneInto(); }
    _cloneInto(to?: Streebog512): Streebog512 {
        to ||= new Streebog512();
        to.buffer = this.buffer.slice();

        return to;
    }
}

/**
 * Compute hash with `Streebog 256 bit` (aka `GOST R 34.11-2012 256 bits`)
 * @param input Input bytes
 */
export const streebog256 = (input: Uint8Array): Uint8Array => new Streebog256().update(input).digest();

/**
 * Compute hash with `Streebog 512 bit` (aka `GOST R 34.11-2012 512 bits`)
 * @param input Input bytes
 * @returns {Uint8Array}
 */
export const streebog512 = (input: Uint8Array): Uint8Array => new Streebog512().update(input).digest();

export * from "./hmac";
export * from "./kdf";
export * from "./pbkdf2";