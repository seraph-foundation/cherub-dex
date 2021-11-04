# Cherub Protocol

Inverse Perpetuals (3, 3) DAO

* **Build** Access or bond deep, protocol-owned liquidity
* **Trade** 100x leverage and zero impermanent loss using virtual Automated Marketing Making
* **Invest** Stake CHRB to receive high-yield, rebased cryptodollars

## Development

**Requirements**

- Anchor 0.16.2
- Solana 1.8.0
- Node 14.18.0

**Running**

A Solana wallet and SOL are required to get started.

```bash
solana-keygen new
yarn protocol:airdrop # Run as long as needed
```

Make sure cluster is set to either `localnet` or `devnet` in `Anchor.toml`, depending on your environment and `.env` is configured correctly.

```bash
yarn protocol:test:localnet
```

Start a demo trading bot.

```bash
yarn protocol:bots:trade:localnet
```

Start a liquidation bot.

```bash
yarn protocol:bots:liquidate:localnet
```

Start the app.

```bash
yarn app:start
```

To deploy the entire protocol on, for example, `devnet`, make sure the correct cluster is set in `Anchor.toml` and run the following.

```bash
yarn protocol:clean
yarn protocol:build:devnet
yarn protocol:deploy:devnet
# Update Anchor.toml and the program id declarations with the deployment public keys
yarn protocol:test:devnet
```

## Documentation

This is currently handled with Docusauraus.

```bash
yarn docs:start
```

### Support

For inquiries, message me on Telegram @pindaroso or Twitter @pindarosothecat. Financial contributions can be sent to:

- **SOL** `GzA3eoD5SFrzeydPqtkaQfBRbBBdboQBWdppuNkRNEuM`
- **BTC** `3L1aBRedf2fKy4MFBTdGfLh4VUFJvqp4Tq`
- **ETH** `0x61bF2Be1362Ca0231f8C30B9C90363d3Ba97929b`
