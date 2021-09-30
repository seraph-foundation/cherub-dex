# XV01 Protocol

Perpetual futures vAMM and yield-based XV01 pooling protocol.

**Features**

- 100x leverage perpetual futures virtual AMM based on high-frequency Pyth indexing
- Zero impermanent loss using advanced virtual AMM technology
- Provide and access deep liquidity with high-yield cryptodollars based on XV01 (a take on DV01)

## Development

**Requirements**

- Anchor 0.15.0
- Solana 1.7.11
- Node 14.15.0

**Running**

Make sure cluster is set to `localnet` in `Anchor.toml`.

```bash
$ solana-validator-test # Run in a separate tab
$ rm -rf .anchor
$ rm -rf target
$ anchor build
$ anchor deploy
$ ANCHOR_PROVIDER_URL=http://127.0.0.1:8899 mocha tests/xv01.js
$ node copyIdl.js
$ cd app && yarn start
```

### Notes

* `airdrop()` in JavaScript test does not work with VPN
* `anchor test` automatically runs `solana-validator-test`
* There is an exploit with Anchor when using duplicate accounts in a single instruction
