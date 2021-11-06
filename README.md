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

Make sure cluster is correctly set to `localnet` in `Anchor.toml` and `.env` is configured properly.

```bash
solana config set --url http://127.0.0.1:8899
yarn protocol:test
```

Start a demo trading bot.

```bash
yarn bots:trade:start
```

Start a liquidation bot.

```bash
yarn bots:liquidate:start
```

Start the app.

```bash
yarn sdk:copy # Make sure latest SDK is installed
yarn app:start
```

To deploy the protocol on `devnet`, make sure the correct cluster is set in `Anchor.toml` and `.env` and run the following.

```bash
solana config set --url https://api.devnet.solana.com
yarn protocol:clean
yarn protocol:build
yarn protocol:deploy
# Update Anchor.toml and the program id declarations with the deployment public keys
yarn protocol:test
```

### Development

```bash
ln -s sdk app/node_modules/sdk
```

## Documentation

This is currently handled with Docusauraus.

```bash
yarn docs:start
```

### Support

For inquiries, message me on Telegram @pindaroso or Twitter @pindarosothecat.
