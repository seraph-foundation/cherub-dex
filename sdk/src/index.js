const { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, Token } = require('@solana/spl-token')
const { BN } = require('@project-serum/anchor')
const anchor = require('@project-serum/anchor')
const dotenv = require('dotenv')

const { SYSVAR_CLOCK_PUBKEY, PublicKey, SystemProgram } = anchor.web3

const exchangeIdl = require('./idl/exchange.json')
const factoryIdl = require('./idl/factory.json')

const Direction = {
  Long: { long: {} },
  Short: { short: {} }
}
const Status = {
  Open: { open: {} },
  Closed: { closed: {} },
  Liquidated: { liquidated: {} }
}

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const toBuffer = (x) => {
  return Buffer.from(anchor.utils.bytes.utf8.encode(x))
}

function init() {
  dotenv.config()
  anchor.setProvider(anchor.Provider.env())

  const provider = anchor.getProvider()

  const IS_LOCALNET = provider.connection._rpcEndpoint === 'http://127.0.0.1:8899'

  if (IS_LOCALNET) {
    accounts = require('./accounts/localnet.json')
  } else {
    accounts = require('./accounts/devnet.json')
  }

  exchange = anchor.workspace.Exchange
  factory = anchor.workspace.Factory

  return {
    accounts,
    provider,

    programs: {
      exchange,
      factory
    }
  }
}

module.exports = {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  BN,
  TOKEN_PROGRAM_ID,
  SYSVAR_CLOCK_PUBKEY,
  PublicKey,
  SystemProgram,
  Token: Token,

  Direction,
  Status,

  init,
  sleep,
  toBuffer
}
