---
sidebar_position: 1
---

# Tokenomics

The protocol tokenomics are fairly simple. Bonds are sold for discounted protocol tokens as a means of providing liquidity for the exchange. Trades are made via a virtual [AMM](/about/terminology.md#amm) with a bonding curve that ranges between `+/- 1`. An invariant of `0` represents equal [market](/about/terminology.md#market-price) and [index](/about/terminology.md#index-price) prices. The liquidation and bankruptcy spread is based on open interest ([OI](/about/terminology.md#open-interest-oi)). This spread is dynamically calculated based on the difference between the insurance fund holdings and OI. When the insurance fund is large, the spread is small, and vise versa. The insurance fund grows by receiving the liquidation and bankruptcy price spread from trading.
