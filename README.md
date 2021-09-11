# XV01 Yield-Based Perpetuals Protocol

A Virtual Automated Market Maker (vAMM) for perpetual yield-based futures on Solana.

**Features**

- XV01 perpetual futures based on high fidelity DV01 indexing
- Zero impermanent loss based on next generation AMM technology
- Deep liquidity with up to 100x leverage

### Notes

* `airdrop` in JavaScript library does not work with VPN
* `anchor test` automatically runs `solana-validator-test`
* For sizing, 1 (bool) + 32 (Pubkey) + 8 (u64)

### Security

* There is an exploit with Anchor when using duplicate accounts in an instruction
