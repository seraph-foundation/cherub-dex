---
sidebar_position: 2
---

# Architecture

## DAO

Governing principles for the factory and exchange are handled by the [DAO](/docs/about/terminology#dao). See [code](https://github.com/cherub-protocol/cherub-protocol/tree/master/programs/dao) for more information.

## Factory

Factory contract code is responsible for creating, reading, updating and deleting asset exchanges. See [code](https://github.com/cherub-protocol/cherub-protocol/tree/master/programs/factory) for more information.

## Exchange

Cherub is based on a unique implementation of the constant product market making [vAMM](/docs/about/terminology#virtual-automated-market-maker-vamm) function $x \times y = k$. See [code](https://github.com/cherub-protocol/cherub-protocol/tree/master/programs/exchange) for more information.

## Oracle

The oracle is responsible for determining the spot price of a given asset. See [code](https://github.com/cherub-protocol/cherub-protocol/tree/master/programs/oracle) for more information.


