const { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, Token } = require('@solana/spl-token')
const anchor = require('@project-serum/anchor')
const dotenv = require('dotenv')

const exchangeIdl = require('../target/idl/exchange.json')
const factoryIdl = require('../target/idl/factory.json')

const { PublicKey, SystemProgram } = anchor.web3

dotenv.config()

anchor.setProvider(anchor.Provider.env())

const provider = anchor.getProvider()

const IS_LOCALNET = provider.connection._rpcEndpoint === 'http://127.0.0.1:8899'

const accountsFile = IS_LOCALNET ? './app/src/accounts-localnet.json' : './app/src/accounts-devnet.json'

let accounts = {}

if (IS_LOCALNET) {
  accounts = require('../app/src/accounts-localnet.json')
} else {
  accounts = require('./app/src/accounts-devnet.json')
}

const exchange = anchor.workspace.Exchange
const factory = anchor.workspace.Factory

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

const tokenV = new Token(provider.connection, new PublicKey(accounts.exchanges[0].tokenV), TOKEN_PROGRAM_ID, provider.wallet.payer)
const decimalsV = 9
const walletAmountV = 1000000 * (10 ** decimalsV)

async function main() {
  console.log('Running....')

  while (true) {
    await sleep(1000)
  }
}

main()
