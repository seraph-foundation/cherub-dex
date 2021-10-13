# XV01 Protocol

Inverse Perpetuals DAO

**Features**

- Trade 100x leverage with zero impermanent loss and high-fidelity on-chain indexing using vAMM technology
- Access or provide deep, protocol-owned liquidity
- DAO protocol governance based on high-yield, rebased bonding token

## Development

**Requirements**

- Anchor 0.16.2
- Solana 1.7.12
- Node 14.18.0

**Running**

Make sure cluster is set to `localnet` in `Anchor.toml`.

```bash
anchor test --detach  # Run in a eparate terminal
cd app && yarn start
```

### Notes

* `airdrop()` in JavaScript test does not work with VPN
* There is an exploit with Anchor when using duplicate accounts in a single instruction
