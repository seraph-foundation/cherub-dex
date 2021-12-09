const { FTXUS } = require('ftx-us');
const { BN, TOKEN_PROGRAM_ID, PublicKey, Token, init, sleep, toBuffer } = require('../sdk/src')

const config = init()

async function main() {
  console.log('Running....')

  // Key and secret are needed for market data feed
  const ftxUS = new FTXUS({ key: process.env.FTX_API_KEY, secret: process.env.FTX_API_SECRET })

  while (true) {
    var markets

    try {
      markets = await ftxUS.Markets.list()
    } catch (e) {
      console.log(e)
      continue
    }

    for (let i = 0; i < config.accounts.exchanges.length; i++) {
      const oraclePk = new PublicKey(config.accounts.exchanges[i].oracle)
      const tokenPk = new PublicKey(config.accounts.exchanges[i].tokenV)

      const tokenV = new Token(config.provider.connection, tokenPk, TOKEN_PROGRAM_ID, config.provider.wallet.payer)
      const mintInfoV = await tokenV.getMintInfo()

      const market = markets.filter(market => market.name === config.accounts.exchanges[i].symbol + '/USD')[0]
      const price = market.price * (10 ** mintInfoV.decimals)

      console.log('Setting token', tokenPk.toString(), 'oracle', oraclePk.toString(), 'price to', price.toString() + '...')

      const tx = await config.programs.pyth.rpc.setPrice(new BN(price), {
        accounts: {
          price: oraclePk
        }
      })

      console.log('Your transaction signature', tx)
    }

    await sleep(1000)
  }
}

main()
