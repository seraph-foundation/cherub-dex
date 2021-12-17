---
sidebar_position: 3
---

# Equations

## Trading

### Price

The mathematics behind the Cherub Protocol inverse perpetuals trading engine are fairly simple.

Trades are made via  This in turn translates to an equal [market](/docs/about/terminology#market-price) and [index](/docs/about/terminology#index-price) price.

### Funding Rate

The [funding rate](/docs/about/terminology#funding-rate) is determined using a [vAMM](/docs/about/terminology#virtual-automated-market-maker-vamm) with an invariant that ranges between $0$ and $2$, with $1$ meaning the demand for long and short positions being equal. The curve is similar to a stablecoin curve.

$$
\begin{aligned}
x\times y &=k\\
1,000,000\times 1,000,000&=1,000,000,000,000
\end{aligned}
$$

The $clamp$ function returns the value clamped to the inclusive range of min and max.

$$
Funding = Premium + clamp(Index - Premium,\ 0.05\%, -0.05\%)
$$

### Liquidation

The liquidation and bankruptcy spread is based on open interest ([OI](/docs/about/terminology#open-interest-oi)). This spread is dynamically calculated based on the difference between the insurance fund holdings and OI. When the insurance fund is large, the spread is small, and vise versa. The insurance fund grows by receiving the liquidation and bankruptcy price spread from trading.

## Bonding

Bonds are sold for discounted protocol tokens as a means of providing liquidity for the exchange. 

## Staking
