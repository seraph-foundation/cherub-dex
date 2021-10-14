# Cherub

Inverse Perpetuals 3,3 DAO.

This project is inspired by Olympus DAO's 3,3 incentive model to align investors, builders and futures traders. While yield farms simply rent liquidity, protocols do not own it, and builders can potentially pump and dump theirs, Cherub is a DEX that relies on bonding - as opposed to pooling - and staking to help solve this prisoner's dilemma problem. That is, Cherub uses staked, or protocol-owned liquidity in the form of a productive treasury to receive and distribute profits from trading, liquidations, and generally speaking, what a CEX, or insurance fund, profits from. Cherub uses bonding to add discounted liquidity to markets at a predetermined price, sells `CHRB` tokens in return, and continually rebases this token to distribute dividends from its treasury.

**Features**

- **Invest** Stake `CHRB` to receive high-yield, rebased cryptodollar yield
- **Build** Access or bond deep, protocol-owned liquidity
- **Trade** 100x leverage with zero impermanent loss using virtual Automated Marketing Making

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

### Support

This project is looking for support! For inquiries, message me on Telegram @pindaroso. SOL donations can be sent to `xb6KGidQAijtLuKxhS4QSgptGKLyXPr1mqt9QQpxAM9`.
