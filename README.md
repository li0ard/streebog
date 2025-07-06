<p align="center">
    <b>@li0ard/streebog</b><br>
    <b>Streebog hash function in pure TypeScript</b>
    <br>
    <a href="https://li0ard.is-cool.dev/streebog">docs</a>
    <br><br>
    <a href="https://github.com/li0ard/streebog/actions/workflows/test.yml"><img src="https://github.com/li0ard/streebog/actions/workflows/test.yml/badge.svg" /></a>
    <a href="https://github.com/li0ard/streebog/blob/main/LICENSE"><img src="https://img.shields.io/github/license/li0ard/streebog" /></a>
    <br>
    <a href="https://npmjs.com/package/@li0ard/streebog"><img src="https://img.shields.io/npm/v/@li0ard/streebog" /></a>
    <a href="https://jsr.io/@li0ard/streebog"><img src="https://jsr.io/badges/@li0ard/streebog" /></a>
    <br>
    <hr>
</p>

> [!WARNING]
> Streebog can't be fast in JS. Being +/- 5x slower than native code means brute-forcing attackers have bigger advantage.

## Installation

```bash
# from NPM
npm i @li0ard/streebog

# from JSR
bunx jsr i @li0ard/streebog
```

## Usage
### Streebog 256 bit (aka GOST R 34.11-2012 256 bit)
```ts
import { streebog256 } from "@li0ard/streebog"

console.log(streebog256(new TextEncoder().encode("hello world")))
```

### Streebog 512 bit (aka GOST R 34.11-2012 512 bit)
```ts
import { streebog512 } from "@li0ard/streebog"

console.log(streebog512(new TextEncoder().encode("hello world")))
```