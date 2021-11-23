---
sidebar_position: 1
---

# Introduction

## What is Cherub?

Cherub is a decentralized finance ([DeFi](/about/terminology.md#decentralized-finance-defi)) inverse perpetuals protocol for **trading**, **staking** and **building**. It runs on the [Solana](https://solana.com/) network and is governed by a Decentralized Autonomous Organization ([DAO](/about/terminology.md#decentralized-autonomous-organization-dao)).

This project is inspired by [Olympus DAO's](https://www.olympusdao.finance/) ([3, 3](/about/terminology.md#(3,3))) incentive model for aligning users. It offers a solution to game theory's [prisoner's dilemma](/about/terminology.md/#prisoners-dilemma). While traders require deep liquidity, stakers have to lock up capital, and builders can potentially pump and dump, Cherub offers a unique solution in the form of an exponential invariant virtual automated market maker ([AMM](/about/terminology.md#amm)) decentralized exchange ([DEX](/about/terminology.md#decentralized-exchange-dex)) governed by a DAO.

The protocol relies on [staking](/about/terminology.md#staking) and [bonding](/about/terminology.md#bonding). It uses staked, or protocol-owned liquidity, in the form of a productive treasury to receive and distribute trading fees, while selling discounted protocol tokens via bonding.

## Why Cherub?

Centralized inverse perpetuals exchanges do not pass value on to users. Cherub attempts to solve this problem by not only being the most capital efficient inverse perpetuals DEX, but also by aiming to be the best protocol for traders, stakers and builders in terms of offering the lowest trade margins available.

Liquidation practices via auto-deleveraged liquidations (ADLS), socialized losses or insurance funds are capital inefficient. Profits are kept by exchanges, require market makers and liquidity to be locked up, and governing is centralized, questionable and unchecked. Cherub solves this. A dynamic liquidation engine improves capital efficiency and profits are distributed to protocol token stakers. This guarantees at least 90% of liquidity (based on open interest) is kept in the insurance fund. A virtual AMM, along with a dynamic liquidation engine ensure ample liquidity, turns the traditional AMM constant product equation (x * y = k) on it’s head by using a 50/50 pool (invariant of 1) creating a pool for longs and shorts. The bankruptcy and liquidation price spread is dynamically generated based on open interest (OI). The protocol is fully decentralized and open meaning all governing is fully transparent.

## Disclaimer

All claims, content, designs, algorithms, estimates, roadmaps, specifications, and performance measurements described in this project are done with the author's best effort. It is up to the reader to check and validate their accuracy and truthfulness. Furthermore, nothing in this project constitutes a solicitation for investment.
