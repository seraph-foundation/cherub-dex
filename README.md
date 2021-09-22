# XV01 Yield-Based Perpetuals Protocol

A Virtual Automated Market Maker (vAMM) for perpetual yield-based futures on Solana.

**Features**

- Perpetual futures AMM based on high-frequency Pyth indexing
- Zero impermanent using on next generation vAMM technology
- Access deep liquidity with up to 100x leverage from XV01 (a take on DV01) investors

## Development

**Requirements**

- Anchor 0.15.0
- Solana 1.7.11
- Node 14.15.0

**Running**

Make sure cluster is set to `localnet` in `Anchor.toml`.

`solana-validator-test`
`anchor deploy`
`node copyIdl.js`
`cd app && yarn start`

### Notes

* For some reason `airdrop()` in JavaScript test does not work with VPN
* Watch out for validator because `anchor test` automatically runs `solana-validator-test`
* For sizing, 1 (bool) + 32 (Pubkey) + 8 (u64)
* There is an exploit with Anchor when using duplicate accounts in a single instruction
