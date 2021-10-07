# XV01 Protocol

Perpetual swaps vAMM with protocol-owned liquidity for high-yield, rebased cryptodollars via XV01

**Features**

- 100x leverage perpetual future swaps virtual AMM with 0 impermanent loss and high-fidelity on-chain indexing
- Provide or access deep, protocol-owned liquidity
- DAO protocol governance based on high-yield, rebased cryptodollars via XV01

## Development

**Requirements**

- Anchor 0.17.0
- Solana 1.7.12
- Node 14.18.0

**Running**

Make sure cluster is set to `localnet` in `Anchor.toml`.

```bash
anchor test --detach  # Run in a eparate terminal
node copyIdl.js
cd app && yarn start
```

### Notes

* `airdrop()` in JavaScript test does not work with VPN
* There is an exploit with Anchor when using duplicate accounts in a single instruction
