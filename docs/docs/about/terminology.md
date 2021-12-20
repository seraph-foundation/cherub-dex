---
sidebar_position: 2
---

# Terminology

## 1, 1

This meme refers to the [prisoner's dilemma](/docs/about/terminology#prisoners-dilemma). In the case of the Cherub Protocol, it involves solely bonding.

| | Stake | Bond | Sell |
|-|-------|------|------|
| **Stake** | 3, 3 | 1, 3 | -1, 1 |
| **Bond** | 3, 1 | **1, 1** | -1, 1 |
| **Sell** | 1, -1 | 1, -1 | -3, -3 |

## 3, 3

This meme refers to the prisoner's dilemma. In the case of Cherub, it involves simultaneously bonding and staking.

| | Stake | Bond | Sell |
|-|-------|------|------|
| **Stake** | **3, 3** | 1, 3 | -1, 1 |
| **Bond** | 3, 1 | 1, 1 | -1, 1 |
| **Sell** | 1, -1 | 1, -1 | -3, -3 |

## Automated Market Maker (AMM)

Automated market makers use liquidity pools instead of relying on a traditional market of buyers and sellers for price discovery. By using a constant product function $x * y=k$, an invariant is determined and used for quoting. In other words, because there is no order book with an AMM, prices are quoted. [Martin Koppelmann](https://www.reddit.com/r/ethereum/comments/55m04x/lets_run_onchain_decentralized_exchanges_the_way/) is credited for making the concept popular.

For example, a new market, or liquidity pool, is created with $100$ ETH and $10,000$ DAI. The constant product $k$ equals $1,000,000$.

$$
\begin{aligned}
x * y &=k\\
100 * 10,000&=1,000,000
\end{aligned}
$$

Next we can see $1$ ETH equals $100$ DAI.

$$
\begin{aligned}
quote&=y / k\\
100&=10,000 / 100
\end{aligned}
$$


Then $1$ DAI equals $0.01$ ETH.

$$
\begin{aligned}
quote&=x / y\\
0.01&=1 / 10,000
\end{aligned}
$$

Finally, a trade is made where $1$ ETH is removed from the pool and swapped for DAI.

$$
\begin{aligned}
(100 - 1) *  (10,000 + x) &= 1,000,000\\
99 * (10,000 + x) &= 1,000,000\\
10,000 + x &= 1,000,000 / 99\\
x &= (1,000,000 / 99) - 10,000\\
x &= 101.0101010101
\end{aligned}
$$

The deeper the liquidity, the lower the change.

## Bank Run

Also known as a "run on the bank", this occurs when a large enough number of users withdraw funds from the exchange because they believe the protocol will cease to operate in the near future. This is detrimental to fractional-reserve systems.

## Bankruptcy Price

The price at which a position is closed in the case of an unmet margin call.

## Bond

Bonding is the process of lending an asset to the DEX for a certain amount of time in exchange for discounted protocol tokens.

## bCHRB

The token received when trading collateral is bonded.

## CHRB

The token used by the DAO to create and vote on proposals is called CHRB.

## Decentralized Autonomous Organization (DAO)

A decentralized autonomous organization (DAO) is an entity controlled by a variety of computers, networks and nodes. It is not controlled by a single institution such as a government or central bank and hence cannot be censored.

## Decentralized Exchange (DEX)

A Decentralized exchange (DEX) is a exchange running on a decentralized network.

## Decentralized Finance (DeFi)

Decentralized finance (DeFi) as opposed to traditional or legacy finance. DeFi is also commonly referred to as "open finance".

## Funding Rate

A funding rate is an interest rate applied to long and short perpetual swap positions. It is used to keep the spot price and contract price in line. When funding is positive, longs pay shorts. When funding is negative, shorts pay longs. See [equations](/docs/protocol/equations#funding-rate) for more information.

## Index Price

The spot price of a given asset used for determining a perpetuals [funding rate](/docs/about/terminology#funding-rate).

## Liquidate

Liquidation is when, in the context of Cherub, the exchange forces a trader to close their position in the case of an unmet margin call. Liquidation practices include auto-deleveraged liquidations (ADLS), socialized losses, and insurance funds. The difference between the bankruptcy and liquidation price is kept by the exchange as profit.

## Market Price

The current protocol market price for a given asset.

## Open Interest (OI)

The total number of unsettled contracts, or the outstanding value of the futures contracts.

## Prisoner's Dilemma

A game theory problem used to analyze why two rational actors might night cooperate in a game. In this dilemma, two prisoner's are locked in solitary confinement for a crime they committed. They are given the choice of betraying the other for no sentence (0) by turning them in, or staying silent for a sentence (1). The below table demonstrates possible outcomes with 1, 1 being the optimal outcome for both.

|| B stays silent | B betrays |
|-----|----------------|-----------|
| **A stays silent** | -1, -1 | 0, -3 |
| **A betrays** | 0, -3 | -2, -2 |

## Pump-and-Dump

A manipulative and illegal scheme that attempts to increase the price of an asset through false information.

## Stake

Staking is akin to keeping your tokens in the protocol thereby preventing a bank run. By staking protocol tokens, users help secure the network and earn rewards while doing so.

## sCHRB

The token received when a user stakes CHRB.

## Trade

The act of buying or selling products or services.

## Treasury Problem

Rapid market growth and decay, along with regulation, has put a strain on the modern treasury. This is becoming more and more clear as the world realizes an increasingly globalized connection through technology. The global financial crisis and subsequent creation of BTC in 2008 are cairns that mark humanity’s path through history.

Uncertainty consequently leads to poor cash management. This includes desperate banking, irresponsible debt and funding, and questionable investing. It also makes it nearly impossible to manage risk for currencies and interest rates as monetary policies and government regimes change, seemingly, daily. This applies to fiat and crypto alike. What they both have in common is, at the core, a requirement for a treasury that provides high-interest yield and on-demand liquidity.

## Virtual Automated Market Maker (vAMM)

This is an abstracted [AMM](/docs/about/terminology#automated-market-maker-amm). It is considered virtual as no actual asset swap ever occurs. Assets are synthetic only. Settlement is done using cash.
