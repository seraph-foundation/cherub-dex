# XV01 Yield-Based Perpetuals Protocol

A Virtual Automated Market Maker (vAMM) for perpetual yield-based futures on Solana.

**Features**

- Perpetual futures based on high frequency XV01 (a take on DV01) indexing
- Zero impermanent loss based on next generation AMM technology
- Deep liquidity with up to 100x leverage

### Notes

* For some reason `airdrop()` in JavaScript test does not work with VPN
* Watch out for validator because `anchor test` automatically runs `solana-validator-test`
* For sizing, 1 (bool) + 32 (Pubkey) + 8 (u64)
* There is an exploit with Anchor when using duplicate accounts in a single instruction
