# Cherub

Inverse Perpetuals (3, 3) DAO

## Development

**Requirements**

- Anchor 0.16.2
- Solana 1.8.0
- Node 14.18.0

**Running**

A Solana wallet and SOL are required to get started.

```bash
solana-keygen new
solana airdrop 5
```

Make sure cluster is set to either `localnet` or `devnet` in `Anchor.toml`, depending on your environment.

```bash
yarn protocol:test:localnet
```

Start the app.

```bash
yarn app:start
```

To deploy the entire protocol, follow below.

```bash
yarn protocol:build:devnet
yarn protocol:deploy:devnet
# Update Anchor.toml and the program id declarations with the deployment public keys
yarn protocol:test:devnet
```

## Documentation

This is currently handled with Docusauraus.

```bash
yarn start:docs
```

### Support

For inquiries, message me on Telegram @pindaroso or Twitter @pindarosothecat. Financial contributions can be sent to:

- **SOL** `GzA3eoD5SFrzeydPqtkaQfBRbBBdboQBWdppuNkRNEuM`
- **BTC** `3L1aBRedf2fKy4MFBTdGfLh4VUFJvqp4Tq`
- **ETH** `0x61bF2Be1362Ca0231f8C30B9C90363d3Ba97929b`
