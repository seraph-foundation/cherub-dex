# Cherub

<a href="https://twitter.com/docusaurus"><img src="https://img.shields.io/badge/docs-0.0.1-x" alt="Docs Badge"/></a>

*Inverse Perpetuals (3, 3) DAO*

This project is inspired by Olympus DAO's (3, 3) incentive model to align investors, builders and futures traders. While yield farms simply rent liquidity, protocols do not own it, and builders can potentially pump and dump theirs, Cherub is a DEX that relies on bonding - as opposed to pooling - and staking to help solve this prisoner's dilemma problem. That is, Cherub uses staked, or protocol-owned liquidity in the form of a productive treasury to receive and distribute profits from trading, liquidations, and generally speaking, what a CEX, or insurance fund, profits from. Cherub uses bonding to add discounted liquidity to markets at a predetermined price, sells `CHRB` tokens in return, and continually rebases this token to distribute dividends.

**Features**

- **Invest** Stake `CHRB` to receive high-yield, rebased cryptodollars
- **Build** Access or bond deep, protocol-owned liquidity
- **Trade** 100x leverage and zero impermanent loss using virtual Automated Marketing Making

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

## Documentation

This is currently handled with Docusauraus.

```bash
cd docs
yarn start
```

### Support

For inquiries, message me on Telegram @pindaroso or Twitter @pindarosothecat. Financial contributions can be sent to:

- **SOL** `GzA3eoD5SFrzeydPqtkaQfBRbBBdboQBWdppuNkRNEuM`
- **BTC** `3L1aBRedf2fKy4MFBTdGfLh4VUFJvqp4Tq`
- **ETH** `0x61bF2Be1362Ca0231f8C30B9C90363d3Ba97929b`
