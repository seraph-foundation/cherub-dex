---
sidebar_position: 2
---

# Terminology

## 1, 1

This meme refers to the prisoner's dilemma. In the case of Cherub, it involves solely bonding.

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

AMM's traditionally use a constant product function `x * y = k` to determine the invariant used for quoting.

## Bank Run

Also known as a "run on the bank", this occurs when a large enough number of users withdraw funds from the exchange because they believe the protocol will cease to operate in the near future. This is detrimental to fractional-reserve systems.

## Bond

Bonding is the process of lending an asset to the DEX for a certain amount of time in exchange for discounted protocol tokens.

## Decentralized Autonomous Organization (DAO)

A decentralized autonomous organization (DAO) is an entity controlled by a variety of computers, networks and nodes. It is not controlled by a single institution such as a government or central bank and hence cannot be censored.

## Decentralized Exchange (DEX)

An exchange running on a decentralized network.

## Decentralized Finance (DeFi)

Decentralized finance as opposed to traditional or legacy finance. DeFi is also commonly referred to as "open finance".

## Funding Rate

A $Funding\ Rate\ (F)$ is used to keep the spot price and perpetual swap contract price in line. The formula to calculate $F$ with $Premium\ Index\ (P)$ and an $Interest\ Rate\ (I)$ is as follows.

$$
F=P+ clamp(I-P,\ 0.05\%, -0.05\%)
$$

The $clamp$ function returns the value clamped to the inclusive range of min and max. When funding is positive, longs pay shorts. When funding is negative, shorts pay longs.

## Index Price

The spot price of a given asset.

## Liquidate

Liquidation is when, in the context of Cherub, the exchange forces a trader to close their position in the case of an unmet margin call. Liquidation practices include auto-deleveraged liquidations (ADLS), socialized losses or insurance funds. The difference between the bankruptcy and liquidation price is kept by the exchange as profit.

## Market Price

The current protocol market price for a given asset.

## Open Interest (OI)

This is the total number of unsettled contracts, or the outstanding value of the futures contracts.

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

## Trade

The act of buying or selling products or services.
