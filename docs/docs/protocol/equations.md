---
sidebar_position: 3
---

# Equations

## Trading

### Funding

The [funding rate](/docs/about/terminology#funding-rate) is determined using the standard funding equation in conjunction with a [vAMM](/docs/about/terminology#virtual-automated-market-maker-vamm) with an invariant that ranges between $0$ and $2$, with $1$ meaning the demand for long and short positions being equal. The curve is similar to those used for stablecoins.

$$
funding = premium + clamp(index - premium,\ 0.05\%, -0.05\%)
$$

The $clamp$ function returns a value within an inclusive range between minimum and maximum values.

$$
x * y = k
$$

### Open Interest

$$
\displaystyle\sum_{i=1}^{positions} collateral_i * leverage_i
$$

### Market

The [market price](/docs/about/terminology#market-price) is calculated based on [open interest](/docs/about/terminology#open-interest-io) and the [index](/docs/about/terminology#index-price) price.

$$
market = index * (1 + funding)
$$

### Liquidation

This spread is based on the difference between the [liquidation price](/docs/about/terminology#liquidation-price) and [bankruptcy price](/docs/about/terminology#bankruptcy-price).

$$
spread = liquidationPrice - bankruptcyPrice
$$

## Bonding

[Bonds](/docs/about/terminology#bond) are sold for discounted protocol tokens as a means of providing liquidity for the exchange.

$$
bondPrice = 1 + premium
$$

## Staking

[Staking](/docs/about/terminology#stake) CHRB mints sCHRB.

$$
deposit = withdrawal
$$

The ratio of swapped CHRB and sCHRB is always 1:1.

$$
rebase = 1 - (chrbDeposits / sCHRB)
