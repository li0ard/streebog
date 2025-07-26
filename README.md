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
> This library is currently in alpha stage: the lib is not very stable yet, and there may be a lot of bugs
> feel free to try it out, though, any feedback is appreciated!

## Installation

```bash
# from NPM
npm i @li0ard/streebog

# from JSR
bunx jsr i @li0ard/streebog
```

## Supported modes
- [x] Hash function
- [x] PBKDF2 (for 512 bit)
- [x] HMAC (256/512 bit)
- [x] `KDF_GOSTR3411_2012_256` and `KDF_TREE_GOSTR3411_2012_256`

## Features
- Provides simple and modern API
- Most of the APIs are strictly typed
- Fully complies with [GOST R 34.11-2012 (RFC 6986)](https://datatracker.ietf.org/doc/html/rfc6986) standards
- Supports Bun, Node.js, Deno, Browsers

## Examples
### Streebog 256 bit (aka GOST R 34.11-2012 256 bit)
```ts
import { streebog256 } from "@li0ard/streebog"

console.log(streebog256(new TextEncoder().encode("hello world")))

// OR

import { Streebog256 } from "@li0ard/streebog"

const hash = new Streebog256()
hash.update(new TextEncoder().encode("hello world"))
console.log(hash.digest())
```

### Streebog 512 bit (aka GOST R 34.11-2012 512 bit)
```ts
import { streebog512 } from "@li0ard/streebog"

console.log(streebog512(new TextEncoder().encode("hello world")))

// OR

import { Streebog512 } from "@li0ard/streebog"

const hash = new Streebog512()
hash.update(new TextEncoder().encode("hello world"))
console.log(hash.digest())
```