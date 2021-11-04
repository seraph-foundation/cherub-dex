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

  const [exchangePda, exchangeBump] = await anchor.web3.PublicKey.findProgramAddress([tokenV.publicKey.toBuffer()], exchange.programId)

  const walletTokenAccountV = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    tokenV.publicKey,
    provider.wallet.publicKey
  )

  await tokenV.mintTo(walletTokenAccountV, provider.wallet.publicKey, [], walletAmountV)

  while (true) {
    const open = Math.floor((Math.random() * 2) + 1) === 1

    const [walletMetaPda, walletMetaBump] = await PublicKey.findProgramAddress([
      toBuffer('meta'), tokenV.publicKey.toBuffer(), provider.wallet.publicKey.toBuffer()
    ], exchange.programId)
    const exchangeMetaDataAccountInfo = await exchange.account.metaData.fetch(walletMetaPda)
    const positions = exchangeMetaDataAccountInfo.positions.toNumber()

    if (open) {
      const amount = Math.floor((Math.random() * 1000) + 1) * (10 ** decimalsV)
      const deadline = Date.now() / 1000
      const displayAmount = (amount / (10 ** decimalsV)).toString() + 'USD'
      const equity = 1
      const leverage = Math.floor((Math.random() * 100) + 1)
      const long = Math.floor((Math.random() * 2) + 1) === 1

      const [positionPda, positionBump] = await anchor.web3.PublicKey.findProgramAddress([
        toBuffer('position'), tokenV.publicKey.toBuffer(), provider.wallet.publicKey.toBuffer(), toBuffer(positions)
      ], exchange.programId)

      const args = {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: new PublicKey(accounts.exchanges[0].account),
          exchangeV: new PublicKey(accounts.exchanges[0].accountV),
          meta: walletMetaPda,
          pda: exchangePda,
          position: positionPda,
          recipient: walletTokenAccountV,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          userV: walletTokenAccountV
        }
      }

      let tx
      if (long) {
        tx = await exchange.rpc.bToAInput(new anchor.BN(amount), positionBump, new anchor.BN(deadline), Direction.Long, new anchor.BN(equity), args)
      } else {
        tx = await exchange.rpc.aToBInput(new anchor.BN(amount), positionBump, new anchor.BN(deadline), Direction.Short, new anchor.BN(equity), args)
      }

      console.log(leverage + 'x', 'leverage', long ? 'long' : 'short' , 'trade for', displayAmount, 'transaction signature', tx)
    } else {
      // TODO: Implement closing positions
    }

    await sleep(1000)
  }
}

main()
