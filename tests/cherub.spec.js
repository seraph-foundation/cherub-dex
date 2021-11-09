const { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, TOKEN_PROGRAM_ID, Token } = require('@solana/spl-token')
const { parsePriceData } = require('@pythnetwork/client')
const anchor = require('@project-serum/anchor')
const assert = require('assert')
const fs = require('fs')

const daoIdl = require('../target/idl/dao.json')
const exchangeIdl = require('../target/idl/exchange.json')
const factoryIdl = require('../target/idl/factory.json')
const pythIdl = require('../target/idl/pyth.json')

const { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } = anchor.web3

describe('Cherub', () => {
  anchor.setProvider(anchor.Provider.env())

  const provider = anchor.getProvider()

  const IS_LOCALNET = provider.connection._rpcEndpoint === 'http://127.0.0.1:8899'

  const accountsFile = IS_LOCALNET ? './sdk/src/accounts/localnet.json' : './sdk/src/accounts/devnet.json'

  const dao = anchor.workspace.Dao
  const exchange = anchor.workspace.Exchange
  const factory = anchor.workspace.Factory
  const pyth = anchor.workspace.Pyth

  let mintAuthority = provider.wallet

  let tokenC
  let tokenS

  let token0V
  let token1V

  const decimalsC = 9
  const decimalsS = 9

  const decimals0V = 9
  const decimals1V = 9

  let daoAccount
  let exchangeAccount0
  let exchangeAccount1
  let factoryAccount
  let oracleAccount0
  let oracleAccount1

  let exchangeTokenAccount0V
  let exchangeTokenAccount1V

  let walletTokenAccountC
  let walletTokenAccountS

  let walletTokenAccount0V
  let walletTokenAccount1V

  let walletMetaPdaFactory
  let walletMetaBumpFactory

  let walletMetaPda0
  let walletMetaBump0

  let walletMetaPda1
  let walletMetaBump1

  const walletAmountAirdrop = IS_LOCALNET ? 500 * LAMPORTS_PER_SOL : 5 * LAMPORTS_PER_SOL

  const walletAmount0V = 1000000 * (10 ** decimals0V)
  const walletAmount1V = 1000000 * (10 ** decimals1V)

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

  it('State: Creates initial accounts and mints tokens', async () => {
    daoAccount = anchor.web3.Keypair.generate()
    exchangeAccount0 = anchor.web3.Keypair.generate()
    exchangeAccount1 = anchor.web3.Keypair.generate()
    factoryAccount = anchor.web3.Keypair.generate()
    oracleAccount0 = anchor.web3.Keypair.generate()
    oracleAccount1 = anchor.web3.Keypair.generate()

    await provider.connection.confirmTransaction(await provider.connection.requestAirdrop(provider.wallet.publicKey, walletAmountAirdrop), 'confirmed')

    tokenC = await Token.createMint(provider.connection, provider.wallet.payer, mintAuthority.publicKey, null, decimalsC, TOKEN_PROGRAM_ID)
    tokenS = await Token.createMint(provider.connection, provider.wallet.payer, mintAuthority.publicKey, null, decimalsS, TOKEN_PROGRAM_ID)

    token0V = await Token.createMint(provider.connection, provider.wallet.payer, mintAuthority.publicKey, null, decimals0V, TOKEN_PROGRAM_ID)
    token1V = await Token.createMint(provider.connection, provider.wallet.payer, mintAuthority.publicKey, null, decimals1V, TOKEN_PROGRAM_ID)

    factoryTokenAccountC = await tokenC.createAssociatedTokenAccount(factoryAccount.publicKey)

    walletTokenAccountC = await tokenC.createAssociatedTokenAccount(provider.wallet.publicKey)
    walletTokenAccountS = await tokenS.createAssociatedTokenAccount(provider.wallet.publicKey)

    walletTokenAccount0V = await token0V.createAssociatedTokenAccount(provider.wallet.publicKey)
    walletTokenAccount1V = await token1V.createAssociatedTokenAccount(provider.wallet.publicKey)

    exchangeTokenAccount0V = await token0V.createAssociatedTokenAccount(exchangeAccount0.publicKey)
    exchangeTokenAccount1V = await token1V.createAssociatedTokenAccount(exchangeAccount1.publicKey)

    await token0V.mintTo(walletTokenAccount0V, mintAuthority.publicKey, [], walletAmount0V)
    await token1V.mintTo(walletTokenAccount1V, mintAuthority.publicKey, [], walletAmount1V)

    console.log('Your wallet airdrop', (walletAmountAirdrop / LAMPORTS_PER_SOL).toString(), 'SOL')

    let walletTokenAccountInfoV = await token0V.getAccountInfo(walletTokenAccount0V)
    assert.ok(walletTokenAccountInfoV.amount.toNumber() == walletAmount0V)

    let exchangeTokenAccountInfo0V = await token0V.getAccountInfo(exchangeTokenAccount0V)
    let exchangeTokenAccountInfo1V = await token1V.getAccountInfo(exchangeTokenAccount1V)
    assert.ok(exchangeTokenAccountInfo0V.amount.toNumber() == 0)
    assert.ok(exchangeTokenAccountInfo1V.amount.toNumber() == 0)

    let tokenInfo0V = await token0V.getMintInfo()
    assert.ok(tokenInfo0V.supply.toNumber() == walletAmount0V)

    let tokenInfo1V = await token1V.getMintInfo()
    assert.ok(tokenInfo1V.supply.toNumber() == walletAmount1V)

    let tokenInfoC = await tokenC.getMintInfo()
    assert.ok(tokenInfoC.supply.toNumber() == 0)

    let tokenInfoS = await tokenS.getMintInfo()
    assert.ok(tokenInfoS.supply.toNumber() == 0)
  })

  it('State: Saves accounts and IDL', async () => {
    fs.writeFileSync(accountsFile, JSON.stringify({
      dao: {
        account: daoAccount.publicKey.toString()
      },
      exchanges: [{
        account: exchangeAccount0.publicKey.toString(),
        accountV: exchangeTokenAccount0V.toString(),
        oracle: oracleAccount0.publicKey.toString(),
        symbol: 'SOL',
        tokenV: token0V.publicKey.toString()
      }, {
        account: exchangeAccount1.publicKey.toString(),
        accountV: exchangeTokenAccount1V.toString(),
        oracle: oracleAccount1.publicKey.toString(),
        symbol: 'BTC',
        tokenV: token1V.publicKey.toString()
      }],
      factory: {
        account: factoryAccount.publicKey.toString(),
        accountC: factoryTokenAccountC.toString(),
        tokenC: tokenC.publicKey.toString(),
        tokenS: tokenS.publicKey.toString()
      }
    }))

    console.log('Your accounts file', IS_LOCALNET ? 'localnet' : 'devnet')

    fs.writeFileSync('./sdk/src/idl/dao.json', JSON.stringify(daoIdl))
    fs.writeFileSync('./sdk/src/idl/exchange.json', JSON.stringify(exchangeIdl))
    fs.writeFileSync('./sdk/src/idl/factory.json', JSON.stringify(factoryIdl))
    fs.writeFileSync('./sdk/src/idl/pyth.json', JSON.stringify(pythIdl))

    // TODO: Save seeds
    // daoAccount
    // exchangeAccount0
    // exchangeAccount1
    // factoryAccount
    // oracleAccount0
    // oracleAccount1
  })

  it('DAO: Initializes', async () => {
    const tx = await dao.rpc.initialize({
      accounts: {
        authority: provider.wallet.publicKey,
        dao: daoAccount.publicKey,
        systemProgram: SystemProgram.programId
      },
      signers: [daoAccount]
    })

    console.log('Your transaction signature', tx)

    let daoAccountInfo = await dao.account.daoData.fetch(daoAccount.publicKey)
    assert.ok(daoAccountInfo.proposals.eq(new anchor.BN(0)))
  })

  it('DAO: Creates proposal (index 0)', async () => {
    const [proposalPda, proposalBump] = await anchor.web3.PublicKey.findProgramAddress([toBuffer(0)], dao.programId)
    const deadline = (Date.now() + (1000 * 60 * 60 * 24 * 3)) / 1000
    const description = 'Add AAVE, SUSHI, YFI'
    const tx = await dao.rpc.propose(proposalBump, new anchor.BN(deadline), description, {
      accounts: {
        authority: provider.wallet.publicKey,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        dao: daoAccount.publicKey,
        proposal: proposalPda,
        systemProgram: SystemProgram.programId
      }
    })

    console.log('Your transaction signature', tx)

    let proposalPdaAccountInfo = await dao.account.proposalData.fetch(proposalPda)
    assert.ok(proposalPdaAccountInfo.votes.eq(new anchor.BN(0)))
    assert.ok(proposalPdaAccountInfo.description === description)
    assert.ok(proposalPdaAccountInfo.deadline.eq(new anchor.BN(deadline)))
    assert.ok(proposalPdaAccountInfo.index.eq(new anchor.BN(0)))
  })

  it('DAO: Creates proposal (index 1)', async () => {
    const [proposalPda, proposalBump] = await anchor.web3.PublicKey.findProgramAddress([toBuffer(1)], dao.programId)
    const deadline = (Date.now() + (1000 * 60 * 60 * 24 * 10)) / 1000
    const description = 'Move SOL/COPE stake to SOL/MANGO'
    const tx = await dao.rpc.propose(proposalBump, new anchor.BN(deadline), description, {
      accounts: {
        authority: provider.wallet.publicKey,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        dao: daoAccount.publicKey,
        proposal: proposalPda,
        systemProgram: SystemProgram.programId
      }
    })

    console.log('Your transaction signature', tx)

    let proposalPdaAccountInfo = await dao.account.proposalData.fetch(proposalPda)
    assert.ok(proposalPdaAccountInfo.votes.eq(new anchor.BN(0)))
    assert.ok(proposalPdaAccountInfo.description === description)
    assert.ok(proposalPdaAccountInfo.deadline.eq(new anchor.BN(deadline)))
    assert.ok(proposalPdaAccountInfo.index.eq(new anchor.BN(1)))
  })

  it('Pyth (index 0): Initializes oracle', async () => {
    const oracleConf0 = 0
    const oracleExpo0 = -9
    const oracleInitPrice0 = 681.47
    const tx = await pyth.rpc.initialize(
      new anchor.BN(oracleInitPrice0).mul(new anchor.BN(10).pow(new anchor.BN(-oracleExpo0))),
      oracleExpo0,
      new anchor.BN(oracleConf0), {
        accounts: {
          price: oracleAccount0.publicKey
        },
        instructions: [
          anchor.web3.SystemProgram.createAccount({
            fromPubkey: pyth.provider.wallet.publicKey,
            lamports: await pyth.provider.connection.getMinimumBalanceForRentExemption(3312),
            newAccountPubkey: oracleAccount0.publicKey,
            programId: pyth.programId,
            space: 3312
          })
        ],
        signers: [oracleAccount0]
      })

    console.log('Your transaction signature', tx)

    const oracleAccountInfo0 = await pyth.provider.connection.getAccountInfo(oracleAccount0.publicKey)
    assert.ok(new anchor.BN(parsePriceData(oracleAccountInfo0.data).price).eq(new anchor.BN(oracleInitPrice0)))
  })

  it('Pyth (index 1): Initializes oracle', async () => {
    const oracleConf1 = 0
    const oracleExpo1 = -9
    const oracleInitPrice1 = 903.49
    const tx = await pyth.rpc.initialize(
      new anchor.BN(oracleInitPrice1).mul(new anchor.BN(10).pow(new anchor.BN(-oracleExpo1))),
      oracleExpo1,
      new anchor.BN(oracleConf1), {
        accounts: {
          price: oracleAccount1.publicKey
        },
        instructions: [
          anchor.web3.SystemProgram.createAccount({
            fromPubkey: pyth.provider.wallet.publicKey,
            lamports: await pyth.provider.connection.getMinimumBalanceForRentExemption(3312),
            newAccountPubkey: oracleAccount1.publicKey,
            programId: pyth.programId,
            space: 3312,
          })
        ],
        signers: [oracleAccount1]
      })

    console.log('Your transaction signature', tx)

    const oracleAccountInfo1 = await pyth.provider.connection.getAccountInfo(oracleAccount1.publicKey)
    assert.ok(new anchor.BN(parsePriceData(oracleAccountInfo1.data).price).eq(new anchor.BN(oracleInitPrice1)))
  })

  it('Factory: Initializes', async () => {
    const fee = 3
    const tx = await factory.rpc.initialize(new anchor.BN(fee), {
      accounts: {
        authority: provider.wallet.publicKey,
        factory: factoryAccount.publicKey,
        systemProgram: SystemProgram.programId
      },
      signers: [factoryAccount]
    })

    console.log('Your transaction signature', tx)

    let factoryAccountInfo = await factory.account.factoryData.fetch(factoryAccount.publicKey)
    assert.ok(factoryAccountInfo.tokens.eq(new anchor.BN(0)))
    assert.ok(factoryAccountInfo.fee.eq(new anchor.BN(fee)))
  })

  it('Factory: Creates exchange (index 0)', async () => {
    const [exchangePda, exchangeBump] = await anchor.web3.PublicKey.findProgramAddress([token0V.publicKey.toBuffer()], exchange.programId)
    const fee0 = 3
    const tx = await factory.rpc.addExchange(
      new anchor.BN(fee0), {
        accounts: {
          exchange: exchangeAccount0.publicKey,
          exchangeV: exchangeTokenAccount0V,
          exchangeProgram: exchange.programId,
          factory: factoryAccount.publicKey,
          tokenC: tokenC.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenV: token0V.publicKey
        },
        instructions: [await exchange.account.exchangeData.createInstruction(exchangeAccount0)],
        signers: [factoryAccount.owner, exchangeAccount0]
      })

    console.log('Your transaction signature', tx)

    let exchangeTokenAccountInfo0V = await token0V.getAccountInfo(exchangeTokenAccount0V)
    assert.ok(exchangeTokenAccountInfo0V.amount.eq(new anchor.BN(0)))
    assert.ok(exchangeTokenAccountInfo0V.owner.equals(exchangePda))

    let factoryAccountInfo = await factory.account.factoryData.fetch(factoryAccount.publicKey)
    assert.ok(factoryAccountInfo.tokens.eq(new anchor.BN(1)))
  })

  it('Factory: Simulate get exchange (index 0)', async () => {
    const [exchangePda, exchangeBump] = await anchor.web3.PublicKey.findProgramAddress([token0V.publicKey.toBuffer()], exchange.programId)
    const dataAccount = anchor.web3.Keypair.generate()
    const res = await factory.simulate.getExchange(
      token0V.publicKey, {
        accounts: {
          authority: provider.wallet.publicKey,
          data: dataAccount.publicKey,
          factory: factoryAccount.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID
        },
        signers: [dataAccount]
      })

    console.log('Simulates transaction')

    assert.ok(res.events[0].name === 'GetExchangeEvent');

    let factoryAccountInfo = await factory.account.factoryData.fetch(factoryAccount.publicKey)
    assert.ok(factoryAccountInfo.tokens.eq(new anchor.BN(1)))
  })

  it('Exchange (index 0): Meta', async () => {
    [walletMetaPda0, walletMetaBump0] = await anchor.web3.PublicKey.findProgramAddress(
      [toBuffer('meta'), token0V.publicKey.toBuffer(), provider.wallet.publicKey.toBuffer()],
      exchange.programId
    )
    const tx = await exchange.rpc.meta(walletMetaBump0, {
      accounts: {
        authority: provider.wallet.publicKey,
        exchange: exchangeAccount0.publicKey,
        meta: walletMetaPda0,
        systemProgram: SystemProgram.programId
      }
    })

    console.log('Your transaction signature', tx)

    let metaDataAccountInfo = await exchange.account.metaData.fetch(walletMetaPda0)
    assert.ok(metaDataAccountInfo.positions.eq(new anchor.BN(0)))
    assert.ok(metaDataAccountInfo.bonds.eq(new anchor.BN(0)))
  })

  const initialAmountB = 100000 * (10 ** decimals0V)
  const initialBondMinted = 100000 * (10 ** decimalsC)
  const initialMaxAmountA = 100000 * (10 ** decimals0V)
  const initialMinBondC = 0

  it('Exchange (index 0): Bonds (index 0)', async () => {
    const [bondPda, bondBump] = await anchor.web3.PublicKey.findProgramAddress([
      toBuffer('bond'), token0V.publicKey.toBuffer(), provider.wallet.publicKey.toBuffer(), toBuffer(0)
    ], exchange.programId)
    const tx = await exchange.rpc.bond(
      new anchor.BN(initialAmountB),
      bondBump,
      new anchor.BN(Date.now() / 1000),
      new anchor.BN(initialMaxAmountA),
      new anchor.BN(initialMinBondC), {
        accounts: {
          authority: provider.wallet.publicKey,
          bond: bondPda,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeV: exchangeTokenAccount0V,
          meta: walletMetaPda0,
          mintC: tokenC.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          userC: walletTokenAccountC,
          userV: walletTokenAccount0V
        }
      })

    console.log('Your transaction signature', tx)

    let exchangeTokenAccountInfo0V = await token0V.getAccountInfo(exchangeTokenAccount0V)
    let walletTokenAccountInfo0V = await token0V.getAccountInfo(walletTokenAccount0V)
    assert.ok(exchangeTokenAccountInfo0V.amount.eq(new anchor.BN(initialMaxAmountA)))
    assert.ok(walletTokenAccountInfo0V.amount.eq(new anchor.BN(walletAmount0V - initialMaxAmountA)))

    let walletTokenAccountInfoC = await tokenC.getAccountInfo(walletTokenAccountC)
    assert.ok(walletTokenAccountInfoC.amount.eq(new anchor.BN(initialBondMinted)))

    let metaDataAccountInfo = await exchange.account.metaData.fetch(walletMetaPda0)
    assert.ok(metaDataAccountInfo.bonds.eq(new anchor.BN(1)))
  })

  it('Factory: Meta', async () => {
    [walletMetaPdaFactory, walletMetaBumpFactory] = await anchor.web3.PublicKey.findProgramAddress(
      [toBuffer('meta'), provider.wallet.publicKey.toBuffer()],
      factory.programId
    )
    const tx = await factory.rpc.meta(walletMetaBumpFactory, {
      accounts: {
        authority: provider.wallet.publicKey,
        factory: factoryAccount.publicKey,
        meta: walletMetaPdaFactory,
        systemProgram: SystemProgram.programId
      }
    })

    console.log('Your transaction signature', tx)

    let metaDataAccountInfo = await factory.account.metaData.fetch(walletMetaPdaFactory)
    assert.ok(metaDataAccountInfo.stakes.eq(new anchor.BN(0)))
  })

  const stakeAmount = initialBondMinted / 2

  it('Factory: Stakes (index 0)', async () => {
    const [stakePda, stakeBump] = await anchor.web3.PublicKey.findProgramAddress(
      [toBuffer('stake'), provider.wallet.publicKey.toBuffer(), toBuffer(0)],
      factory.programId
    )
    const tx = await factory.rpc.stake(
      new anchor.BN(stakeAmount),
      stakeBump, {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          factoryC: factoryTokenAccountC,
          meta: walletMetaPdaFactory,
          mintS: tokenS.publicKey,
          stake: stakePda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          userC: walletTokenAccountC,
          userS: walletTokenAccountS
        }
      }
    )

    console.log('Your transaction signature', tx)

    let factoryTokenAccountInfoC = await tokenC.getAccountInfo(factoryTokenAccountC)
    assert.ok(factoryTokenAccountInfoC.amount.eq(new anchor.BN(stakeAmount)))

    let walletTokenAccountInfoC = await tokenC.getAccountInfo(walletTokenAccountC)
    let walletTokenAccountInfoS = await tokenS.getAccountInfo(walletTokenAccountS)
    assert.ok(walletTokenAccountInfoC.amount.eq(new anchor.BN(initialBondMinted - stakeAmount)))
    assert.ok(walletTokenAccountInfoS.amount.eq(new anchor.BN(stakeAmount)))

    let metaDataAccountInfo = await factory.account.metaData.fetch(walletMetaPdaFactory)
    assert.ok(metaDataAccountInfo.stakes.eq(new anchor.BN(1)))
  })

  const additionalAmountB = 15000 * (10 ** decimals0V)
  const additionalBondMinted = 375 * (10 ** decimalsC)
  const additionalMaxAmountA = 15000 * (10 ** decimals0V)
  const additionalMinBondC = 375 * (10 ** decimalsC)

  it('Exchange (index 0): Bonds (index 1)', async () => {
    const [bondPda, bondBump] = await anchor.web3.PublicKey.findProgramAddress(
      [toBuffer('bond'), token0V.publicKey.toBuffer(), provider.wallet.publicKey.toBuffer(), toBuffer(1)],
      exchange.programId
    )
    const deadline = Date.now() / 1000
    const tx = await exchange.rpc.bond(
      new anchor.BN(additionalAmountB),
      bondBump,
      new anchor.BN(deadline),
      new anchor.BN(additionalMaxAmountA),
      new anchor.BN(additionalMinBondC), {
        accounts: {
          authority: provider.wallet.publicKey,
          bond: bondPda,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeV: exchangeTokenAccount0V,
          meta: walletMetaPda0,
          mintC: tokenC.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          userC: walletTokenAccountC,
          userV: walletTokenAccount0V
        }
      })

    console.log('Your transaction signature', tx)

    let exchangeTokenAccountInfo0V = await token0V.getAccountInfo(exchangeTokenAccount0V)
    let walletTokenAccountInfo0V = await token0V.getAccountInfo(walletTokenAccount0V)
    assert.ok(exchangeTokenAccountInfo0V.amount.eq(new anchor.BN(initialAmountB + additionalAmountB)))
    assert.ok(walletTokenAccountInfo0V.amount.eq(new anchor.BN(walletAmount0V - initialAmountB - additionalAmountB)))

    let walletTokenAccountInfoC = await tokenC.getAccountInfo(walletTokenAccountC)
    //assert.ok(walletTokenAccountInfoC.amount.eq(new anchor.BN(1)))
  })

  const aToBAmount = 10 * (10 ** decimals0V)

  it('Exchange (index 0): Gets B to A input price quote', async () => {
    const traderInputQuoteAccount = anchor.web3.Keypair.generate()
    const tx = await exchange.rpc.getBToAInputPrice(
      new anchor.BN(aToBAmount),
      {
        accounts: {
          authority: provider.wallet.publicKey,
          exchange: exchangeAccount0.publicKey,
          quote: traderInputQuoteAccount.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [traderInputQuoteAccount]
      })

    console.log('Your transaction signature', tx)

    let traderInputAccountQuoteInfo = await exchange.account.quoteData.fetch(traderInputQuoteAccount.publicKey)
    //assert.ok(traderInputAccountQuoteInfo.price.eq(new anchor.BN(0)))
  })

  it('Exchange (index 0): Simulates getting B to A input price quote', async () => {
    const traderInputQuoteAccount = anchor.web3.Keypair.generate()
    const res = await exchange.simulate.getBToAInputPrice(
      new anchor.BN(aToBAmount),
      {
        accounts: {
          authority: provider.wallet.publicKey,
          exchange: exchangeAccount0.publicKey,
          quote: traderInputQuoteAccount.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [traderInputQuoteAccount]
      })

    console.log('Simulates transaction')

    assert.ok(res.events[0].name === 'QuoteEvent');
    //assert.ok(res.events[0].data.price.eq(new anchor.BN(0)));
  })

  const bToAAmount = 5 * (10 ** decimals0V)

  it('Exchange (index 0): Gets B to A output price', async () => {
    const traderOutputQuoteAccount = anchor.web3.Keypair.generate()
    const tx = await exchange.rpc.getBToAOutputPrice(
      new anchor.BN(bToAAmount),
      {
        accounts: {
          authority: provider.wallet.publicKey,
          exchange: exchangeAccount0.publicKey,
          quote: traderOutputQuoteAccount.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [traderOutputQuoteAccount]
      })

    console.log('Your transaction signature', tx)

    let traderOutputQuoteAccountInfo = await exchange.account.quoteData.fetch(traderOutputQuoteAccount.publicKey)
    //assert.ok(traderOutputQuoteAccountInfo.price.eq(new anchor.BN(0)))
  })

  it('Exchange (index 0): Simulates getting A to B input price quote', async () => {
    const traderInputQuoteAccount = anchor.web3.Keypair.generate()
    const res = await exchange.simulate.getAToBInputPrice(
      new anchor.BN(bToAAmount),
      {
        accounts: {
          authority: provider.wallet.publicKey,
          exchange: exchangeAccount0.publicKey,
          quote: traderInputQuoteAccount.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [traderInputQuoteAccount]
      })

    console.log('Simulates transaction')

    assert.ok(res.events[0].name === 'QuoteEvent');
    //assert.ok(res.events[0].data.price.eq(new anchor.BN(0)));
  })

  const aToBAmountA = 3 * (10 ** decimals1V)

  it('Exchange (index 0): A to B input', async () => {
    const [exchangePda, exchangeBump] = await anchor.web3.PublicKey.findProgramAddress([token0V.publicKey.toBuffer()], exchange.programId)
    const [positionPda, positionBump] = await anchor.web3.PublicKey.findProgramAddress([
      toBuffer('position'), token0V.publicKey.toBuffer(), provider.wallet.publicKey.toBuffer(), toBuffer(0)
    ], exchange.programId)
    const deadline = Date.now() / 1000
    const tx = await exchange.rpc.aToBInput(
      new anchor.BN(aToBAmountA),
      positionBump,
      new anchor.BN(deadline),
      new anchor.BN(aToBAmountA),
      {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeV: exchangeTokenAccount0V,
          pda: exchangePda,
          position: positionPda,
          meta: walletMetaPda0,
          recipient: walletTokenAccount0V,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          userV: walletTokenAccount0V
        }
      })

    console.log('Your transaction signature', tx)

    let exchangeTokenAccountInfo0V = await token0V.getAccountInfo(exchangeTokenAccount0V)
    let walletTokenAccountInfo0V = await token0V.getAccountInfo(walletTokenAccount0V)
    //assert.ok(exchangeTokenAccountInfo0V.amount.eq(new anchor.BN(206)))
    //assert.ok(walletTokenAccountInfo0V.amount.eq(new anchor.BN(99794)))

    let exchangeAccountInfo0 = await exchange.account.exchangeData.fetch(exchangeAccount0.publicKey)
    //assert.ok(exchangeAccount0Info.lastPrice.eq(new anchor.BN(19)))
  })

  const bToAAmountB = 6 * (10 ** decimals0V)

  it('Exchange (index 0): B to A input (index 1)', async () => {
    const [exchangePda, exchangeBump] = await anchor.web3.PublicKey.findProgramAddress([token0V.publicKey.toBuffer()], exchange.programId)
    const [positionPda, positionBump] = await anchor.web3.PublicKey.findProgramAddress([
      toBuffer('position'), token0V.publicKey.toBuffer(), provider.wallet.publicKey.toBuffer(), toBuffer(1)
    ], exchange.programId)
    const deadline = Date.now() / 1000
    const tx = await exchange.rpc.bToAInput(
      new anchor.BN(bToAAmountB),
      positionBump,
      new anchor.BN(deadline),
      new anchor.BN(bToAAmountB),
      {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeV: exchangeTokenAccount0V,
          meta: walletMetaPda0,
          pda: exchangePda,
          position: positionPda,
          recipient: walletTokenAccount0V,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          userV: walletTokenAccount0V
        }
      })

    console.log('Your transaction signature', tx)

    let exchangeTokenAccountInfo0V = await token0V.getAccountInfo(exchangeTokenAccount0V)
    let walletTokenAccountInfo0V = await token0V.getAccountInfo(walletTokenAccount0V)
    //assert.ok(exchangeTokenAccountInfo0V.amount.eq(new anchor.BN(218)))
    //assert.ok(walletTokenAccountInfo0V.amount.eq(new anchor.BN(99782)))

    let exchangeAccountInfo0 = await exchange.account.exchangeData.fetch(exchangeAccount0.publicKey)
    //assert.ok(exchangeAccountInfo0.lastPrice.eq(new anchor.BN(6)))
  })

  it('Exchange (index 0): Update position (index 1)', async () => {
    const [exchangePda, exchangeBump] = await anchor.web3.PublicKey.findProgramAddress([token0V.publicKey.toBuffer()], exchange.programId)
    const [positionPda, positionBump] = await anchor.web3.PublicKey.findProgramAddress([
      toBuffer('position'), token0V.publicKey.toBuffer(), provider.wallet.publicKey.toBuffer(), toBuffer(1)
    ], exchange.programId)
    const deadline = Date.now() / 1000
    const tx = await exchange.rpc.positionUpdate(
      new anchor.BN(bToAAmountB),
      positionBump,
      new anchor.BN(deadline),
      new anchor.BN(bToAAmountB),
      {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeV: exchangeTokenAccount0V,
          meta: walletMetaPda0,
          pda: exchangePda,
          position: positionPda,
          recipient: walletTokenAccount0V,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          userV: walletTokenAccount0V
        }
      })

    console.log('Your transaction signature', tx)

    let exchangeTokenAccountInfo0V = await token0V.getAccountInfo(exchangeTokenAccount0V)
    let walletTokenAccountInfo0V = await token0V.getAccountInfo(walletTokenAccount0V)
    //assert.ok(exchangeTokenAccountInfo0V.amount.eq(new anchor.BN(0)))
    //assert.ok(walletTokenAccountInfo0V.amount.eq(new anchor.BN(0)))

    let positionAccountInfo = await exchange.account.positionData.fetch(positionPda)
    assert.ok(positionAccountInfo.amount.eq(new anchor.BN(0)))
    assert.ok(positionAccountInfo.equity.eq(new anchor.BN(0)))
    assert.ok(positionAccountInfo.status.closed)
  })

  const unbondAmountC = 87 * (10 ** decimalsC)

  it('Exchange (index 0): Unbonds (index 0)', async () => {
    const [exchangePda, exchangeBump] = await anchor.web3.PublicKey.findProgramAddress([token0V.publicKey.toBuffer()], exchange.programId)
    const tx = await exchange.rpc.unbond(
      new anchor.BN(unbondAmountC),
      new anchor.BN(Date.now() / 1000), {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeV: exchangeTokenAccount0V,
          mintC: tokenC.publicKey,
          pda: exchangePda,
          tokenProgram: TOKEN_PROGRAM_ID,
          userC: walletTokenAccountC,
          userV: walletTokenAccount0V
        }
      })

    console.log('Your transaction signature', tx)

    let exchangeTokenAccountInfo0V = await token0V.getAccountInfo(exchangeTokenAccount0V)
    let walletTokenAccountInfo0V = await token0V.getAccountInfo(walletTokenAccount0V)
    //assert.ok(exchangeTokenAccountInfo0V.amount.eq(new anchor.BN(0)))
    //assert.ok(walletTokenAccountInfo0V.amount.eq(new anchor.BN(amount0V)))

    let walletTokenAccountInfoC = await tokenC.getAccountInfo(walletTokenAccountC)
    //assert.ok(walletTokenAccountInfoC.amount.eq(new anchor.BN(0)))
  })

  const finalAmount0B = 750 * (10 ** decimals0V)
  const finalBondMinted0 = 350 * (10 ** decimalsC)
  const finalMaxAmount0A = 1700 * (10 ** decimals0V)
  const finalMinBond0C = 340 * (10 ** decimalsC)

  it('Exchange (index 0): Bonds (index 2)', async () => {
    const [bondPda, bondBump] = await anchor.web3.PublicKey.findProgramAddress(
      [toBuffer('bond'), token0V.publicKey.toBuffer(), provider.wallet.publicKey.toBuffer(), toBuffer(2)],
      exchange.programId
    )
    const deadline = Date.now() / 1000
    const tx = await exchange.rpc.bond(
      new anchor.BN(finalAmount0B),
      bondBump,
      new anchor.BN(deadline),
      new anchor.BN(finalMaxAmount0A),
      new anchor.BN(finalMinBond0C), {
        accounts: {
          authority: provider.wallet.publicKey,
          bond: bondPda,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeV: exchangeTokenAccount0V,
          meta: walletMetaPda0,
          mintC: tokenC.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          userC: walletTokenAccountC,
          userV: walletTokenAccount0V
        }
      })

    console.log('Your transaction signature', tx)

    let exchangeTokenAccountInfo0V = await token0V.getAccountInfo(exchangeTokenAccount0V)
    let walletTokenAccountInfo0V = await token0V.getAccountInfo(walletTokenAccount0V)
    //assert.ok(exchangeTokenAccountInfo0V.amount.eq(new anchor.BN(additionalMaxAmountA)))
    //assert.ok(walletTokenAccountInfo0V.amount.eq(new anchor.BN(99850)))

    let walletTokenAccountCInfo = await tokenC.getAccountInfo(walletTokenAccountC)
    //assert.ok(walletTokenAccountCInfo.amount.eq(new anchor.BN(75)))
  })

  it('Factory: Creates exchange (index 1)', async () => {
    const [pda, bump] = await anchor.web3.PublicKey.findProgramAddress([token1V.publicKey.toBuffer()], exchange.programId)
    const fee1 = 3
    const tx = await factory.rpc.addExchange(
      new anchor.BN(fee1), {
        accounts: {
          exchange: exchangeAccount1.publicKey,
          exchangeV: exchangeTokenAccount1V,
          exchangeProgram: exchange.programId,
          factory: factoryAccount.publicKey,
          tokenC: tokenC.publicKey,
          tokenV: token1V.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID
        },
        instructions: [await exchange.account.exchangeData.createInstruction(exchangeAccount1)],
        signers: [factoryAccount.owner, exchangeAccount1]
      })

    console.log('Your transaction signature', tx)

    let exchangeTokenAccountInfo0V = await token0V.getAccountInfo(exchangeTokenAccount0V)
    //assert.ok(exchangeTokenAccountInfo0V.amount.eq(new anchor.BN(0)))

    let factoryAccountInfo = await factory.account.factoryData.fetch(factoryAccount.publicKey)
    //assert.ok(factoryAccountInfo.tokens.eq(new anchor.BN(1)))
  })

  it('Exchange (index 1): Meta', async () => {
    [walletMetaPda1, walletMetaBump1] = await anchor.web3.PublicKey.findProgramAddress(
      [toBuffer('meta'), token1V.publicKey.toBuffer(), provider.wallet.publicKey.toBuffer()],
      exchange.programId
    )
    const tx = await exchange.rpc.meta(walletMetaBump0, {
      accounts: {
        authority: provider.wallet.publicKey,
        exchange: exchangeAccount1.publicKey,
        meta: walletMetaPda1,
        systemProgram: SystemProgram.programId
      }
    })

    console.log('Your transaction signature', tx)

    let metaDataAccountInfo = await exchange.account.metaData.fetch(walletMetaPda1)
    assert.ok(metaDataAccountInfo.positions.eq(new anchor.BN(0)))
    assert.ok(metaDataAccountInfo.bonds.eq(new anchor.BN(0)))
  })

  const finalAmount1B = 1000 * (10 ** decimals1V)
  const finalBondMinted1 = 1000 * (10 ** decimalsC)
  const finalMaxAmount1A = 1000 * (10 ** decimals1V)
  const finalMinBond1C = 0

  it('Exchange (index 1): Bonds (index 0)', async () => {
    const [bondPda, bondBump] = await anchor.web3.PublicKey.findProgramAddress(
      [toBuffer('bond'), token1V.publicKey.toBuffer(), provider.wallet.publicKey.toBuffer(), toBuffer(0)],
      exchange.programId
    )
    const deadline = Date.now() / 1000
    const tx = await exchange.rpc.bond(
      new anchor.BN(finalAmount1B),
      bondBump,
      new anchor.BN(deadline),
      new anchor.BN(finalMaxAmount1A),
      new anchor.BN(finalMinBond1C), {
        accounts: {
          authority: provider.wallet.publicKey,
          bond: bondPda,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount1.publicKey,
          exchangeV: exchangeTokenAccount1V,
          meta: walletMetaPda1,
          mintC: tokenC.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          userC: walletTokenAccountC,
          userV: walletTokenAccount1V
        }
      })

    console.log('Your transaction signature', tx)

    let exchangeTokenAccountInfo1V = await token1V.getAccountInfo(exchangeTokenAccount1V)
    let walletTokenAccountInfo1V = await token1V.getAccountInfo(walletTokenAccount1V)
    assert.ok(exchangeTokenAccountInfo1V.amount.eq(new anchor.BN(finalMaxAmount1A)))
    //assert.ok(walletTokenAccountInfo1V.amount.eq(new anchor.BN(amount1V - finalMaxAmount1A)))

    let walletTokenAccountInfoC = await tokenC.getAccountInfo(walletTokenAccountC)
    //assert.ok(walletTokenAccountCInfo.amount.eq(new anchor.BN(finalBondMinted1)))
  })
})
