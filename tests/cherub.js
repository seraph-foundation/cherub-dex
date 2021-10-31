const { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, TOKEN_PROGRAM_ID, Token } = require('@solana/spl-token')
const { parsePriceData } = require('@pythnetwork/client')
const anchor = require('@project-serum/anchor')
const assert = require('assert')
const fs = require('fs')

const daoIdl = require('../target/idl/dao.json')
const exchangeIdl = require('../target/idl/exchange.json')
const factoryIdl = require('../target/idl/factory.json')
const pythIdl = require('../target/idl/pyth.json')

const { LAMPORTS_PER_SOL, PublicKey, SystemProgram } = anchor.web3

describe('Cherub', () => {
  anchor.setProvider(anchor.Provider.env())

  const provider = anchor.getProvider()

  const IS_LOCALNET = provider.connection._rpcEndpoint === 'http://127.0.0.1:8899'

  const accountsFile = IS_LOCALNET ? './app/src/accounts-localnet.json' : './app/src/accounts-devnet.json'

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

  const daoAccount = anchor.web3.Keypair.generate()
  const exchangeAccount0 = anchor.web3.Keypair.generate()
  const exchangeAccount1 = anchor.web3.Keypair.generate()
  const factoryAccount = anchor.web3.Keypair.generate()

  let oracleAccount0 = anchor.web3.Keypair.generate()
  let oracleAccount1 = anchor.web3.Keypair.generate()

  let exchangeTokenAccount0V
  let exchangeTokenAccount1V

  let walletTokenAccountC
  let walletTokenAccountS

  let walletTokenAccount0V
  let walletTokenAccount1V

  const airdropAmount = IS_LOCALNET ? 500 * LAMPORTS_PER_SOL : 5 * LAMPORTS_PER_SOL

  const walletAmount0V = 100000 * (10 ** decimals0V)
  const walletAmount1V = 100000 * (10 ** decimals1V)

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

  it('State: Initializes', async () => {
    await provider.connection.confirmTransaction(await provider.connection.requestAirdrop(provider.wallet.publicKey, airdropAmount), 'confirmed')

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

    await token0V.mintTo(walletTokenAccount0V, mintAuthority.publicKey, [], walletAmount0V);
    await token1V.mintTo(walletTokenAccount1V, mintAuthority.publicKey, [], walletAmount1V);

    console.log('Your wallet was airdropped', airdropAmount / LAMPORTS_PER_SOL, 'SOL')

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

  it('State: Save', async () => {
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
        symbol: 'CHRB',
        tokenV: token1V.publicKey.toString()
      }],
      factory: {
        account: factoryAccount.publicKey.toString(),
        accountC: factoryTokenAccountC.toString(),
        tokenC: tokenC.publicKey.toString(),
        tokenS: tokenS.publicKey.toString()
      }
    }))

    console.log('Your accounts have been written to', accountsFile)

    fs.writeFileSync('./app/src/dao.json', JSON.stringify(daoIdl))
    fs.writeFileSync('./app/src/exchange.json', JSON.stringify(exchangeIdl))
    fs.writeFileSync('./app/src/factory.json', JSON.stringify(factoryIdl))
    fs.writeFileSync('./app/src/pyth.json', JSON.stringify(pythIdl))
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

  it('DAO: Creates first proposal', async () => {
    const [proposalPda, proposalBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode(0))], dao.programId)
    const deadline = (Date.now() + (60 * 60 * 24 * 3)) / 1000
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

  it('DAO: Creates second proposal', async () => {
    const [proposalPda, proposalBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode(1))], dao.programId)
    const deadline = (Date.now() + (60 * 60 * 24 * 4)) / 1000
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

  it('Pyth: Initializes first oracle', async () => {
    const oracleInitPrice0 = 681.47
    const oracleConf0 = 0
    const oracleExpo0 = -9
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
            newAccountPubkey: oracleAccount0.publicKey,
            space: 3312,
            lamports: await pyth.provider.connection.getMinimumBalanceForRentExemption(3312),
            programId: pyth.programId
          })
        ],
        signers: [oracleAccount0]
      })

    console.log('Your transaction signature', tx)

    const oracleAccountInfo0 = await pyth.provider.connection.getAccountInfo(oracleAccount0.publicKey)
    assert.ok(new anchor.BN(parsePriceData(oracleAccountInfo0.data).price).eq(new anchor.BN(oracleInitPrice0)))
  })

  it('Pyth: Initializes second oracle', async () => {
    const oracleInitPrice1 = 903.49
    const oracleConf1 = 0
    const oracleExpo1 = -9
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
            newAccountPubkey: oracleAccount1.publicKey,
            space: 3312,
            lamports: await pyth.provider.connection.getMinimumBalanceForRentExemption(3312),
            programId: pyth.programId
          })
        ],
        signers: [oracleAccount1]
      })

    console.log('Your transaction signature', tx)

    const oracleAccountInfo1 = await pyth.provider.connection.getAccountInfo(oracleAccount1.publicKey)
    assert.ok(new anchor.BN(parsePriceData(oracleAccountInfo1.data).price).eq(new anchor.BN(oracleInitPrice1)))
  })

  it('Factory: Initializes', async () => {
    const tx = await factory.rpc.initialize(exchange.programId, {
      accounts: {
        authority: provider.wallet.publicKey,
        factory: factoryAccount.publicKey,
        systemProgram: SystemProgram.programId
      },
      signers: [factoryAccount]
    })

    console.log('Your transaction signature', tx)

    let factoryAccountInfo = await factory.account.factoryData.fetch(factoryAccount.publicKey)
    assert.ok(factoryAccountInfo.tokenCount.eq(new anchor.BN(0)))
    assert.ok(factoryAccountInfo.exchangeTemplate.toString() == exchange.programId.toString())
  })

  it('Factory: Creates first exchange', async () => {
    const fee0 = 3
    const [pda, bump] = await anchor.web3.PublicKey.findProgramAddress([token0V.publicKey.toBuffer()], exchange.programId)
    const tx = await factory.rpc.createExchange(
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
    assert.ok(exchangeTokenAccountInfo0V.owner.equals(pda))

    let factoryAccountInfo = await factory.account.factoryData.fetch(factoryAccount.publicKey)
    assert.ok(factoryAccountInfo.tokenCount.eq(new anchor.BN(1)))
  })

  const initialMaxAmountA = 10000 * (10 ** decimals0V)
  const initialAmountB = 10000 * (10 ** decimals0V)
  const initialMinBondC = 0
  const initialBondMinted = 10000 * (10 ** decimalsC)

  it('Exchange: Bonds', async () => {
    const tx = await exchange.rpc.bond(
      new anchor.BN(initialMaxAmountA),
      new anchor.BN(initialAmountB),
      new anchor.BN(initialMinBondC),
      new anchor.BN(Date.now() / 1000), {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeV: exchangeTokenAccount0V,
          mintC: tokenC.publicKey,
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
  })

  const stakeAmount = initialBondMinted / 2

  it('Factory: Stakes', async () => {
    const tx = await factory.rpc.stake(
      new anchor.BN(stakeAmount), {
        accounts: {
          authority: provider.wallet.publicKey,
          factoryC: factoryTokenAccountC,
          mintS: tokenS.publicKey,
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
  })

  const additionalMaxAmountA = 15000 * (10 ** decimals0V)
  const additionalAmountB = 15000 * (10 ** decimals0V)
  const additionalMinBondC = 375 * (10 ** decimalsC)
  const additionalBondMinted = 375 * (10 ** decimalsC)

  it('Exchange: Bonds additional', async () => {
    const deadline = new anchor.BN(Date.now() / 1000)
    const tx = await exchange.rpc.bond(
      new anchor.BN(additionalMaxAmountA),
      new anchor.BN(additionalAmountB),
      new anchor.BN(additionalMinBondC),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeV: exchangeTokenAccount0V,
          mintC: tokenC.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          userC: walletTokenAccountC,
          userV: walletTokenAccount0V
        }
      })

    console.log('Your transaction signature', tx)

    let exchangeTokenAccountInfo0V = await token0V.getAccountInfo(exchangeTokenAccount0V)
    let walletTokenAccountInfo0V = await token0V.getAccountInfo(walletTokenAccount0V)
    assert.ok(exchangeTokenAccountInfo0V.amount.eq(new anchor.BN(initialMaxAmountA + additionalMaxAmountA)))
    assert.ok(walletTokenAccountInfo0V.amount.eq(new anchor.BN(walletAmount0V - initialMaxAmountA - additionalMaxAmountA)))

    let walletTokenAccountInfoC = await tokenC.getAccountInfo(walletTokenAccountC)
    //assert.ok(walletTokenAccountInfoC.amount.eq(new anchor.BN(initialBondMinted + additionalBondMinted)))
  })

  const traderInputQuoteAccount = anchor.web3.Keypair.generate()
  const aToBAmount = 10 * (10 ** decimals0V)

  it('Exchange: Gets input price', async () => {
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

    let traderInputAccountQuoteInfo = await exchange.account.quote.fetch(traderInputQuoteAccount.publicKey)
    //assert.ok(traderInputAccountQuoteInfo.price.eq(new anchor.BN(48 ** decimals0B)))
  })

  const traderOutputQuoteAccount = anchor.web3.Keypair.generate()
  const bToAAmount = 5 * (10 ** decimals0V)

  it('Exchange: Gets output price', async () => {
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

    let traderOutputQuoteAccountInfo = await exchange.account.quote.fetch(traderOutputQuoteAccount.publicKey)
    //assert.ok(traderOutputQuoteAccountInfo.price.eq(new anchor.BN(4)))
  })

  const aToBAmountA = 3 * (10 ** decimals1V)

  it('Exchange: A to B input', async () => {
    const [exchangePda, exchangeBump] = await anchor.web3.PublicKey.findProgramAddress([token0V.publicKey.toBuffer()], exchange.programId)
    const [positionPda, positionBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode('position')), token0V.publicKey.toBuffer(), provider.wallet.publicKey.toBuffer()],
      exchange.programId
    )
    const deadline = Date.now() / 1000
    const tx = await exchange.rpc.aToBInput(
      new anchor.BN(aToBAmountA),
      positionBump,
      new anchor.BN(deadline),
      Direction.Short,
      new anchor.BN(aToBAmountA),
      {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeV: exchangeTokenAccount0V,
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
    //assert.ok(exchangeTokenAccountInfo0V.amount.eq(new anchor.BN(206)))
    //assert.ok(walletTokenAccountInfo0V.amount.eq(new anchor.BN(99794)))

    let exchangeAccountInfo0 = await exchange.account.exchangeData.fetch(exchangeAccount0.publicKey)
    //assert.ok(exchangeAccount0Info.lastPrice.eq(new anchor.BN(19)))
  })

  const bToAAmountB = 6 * (10 ** decimals0V)

  //it('Exchange: B to A input', async () => {
  //  const index = 1
  //  const [pda, bump] = await anchor.web3.PublicKey.findProgramAddress(
  //    [token0V.publicKey.toBuffer()],
  //    exchange.programId
  //  )
  //  const [positionPda, bump] = await anchor.web3.PublicKey.findProgramAddress(
  //    [token0V.publicKey.toBuffer(), provider.wallet.publicKey.toBuffer()],
  //    exchange.programId
  //  )
  //  const deadline = Date.now() / 1000
  //  const tx = await exchange.rpc.bToAInput(
  //    new anchor.BN(bToAAmountB),
  //    bump,
  //    new anchor.BN(deadline),
  //    Direction.Long,
  //    new anchor.BN(bToAAmountB),
  //    new anchor.BN(index),
  //    {
  //      accounts: {
  //        authority: provider.wallet.publicKey,
  //        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  //        exchange: exchangeAccount0.publicKey,
  //        exchangeV: exchangeTokenAccount0V,
  //        pda,
  //        position: positionPda,
  //        recipient: walletTokenAccount0V,
  //        systemProgram: SystemProgram.programId,
  //        tokenProgram: TOKEN_PROGRAM_ID,
  //        userV: walletTokenAccount0V
  //      }
  //    })

  //  console.log('Your transaction signature', tx)

  //  let exchangeTokenAccountInfo0V = await token0V.getAccountInfo(exchangeTokenAccount0V)
  //  let walletTokenAccountInfo0V = await token0V.getAccountInfo(walletTokenAccount0V)
  //  //assert.ok(exchangeTokenAccountInfo0V.amount.eq(new anchor.BN(218)))
  //  //assert.ok(walletTokenAccountInfo0V.amount.eq(new anchor.BN(99782)))

  //  //let exchangeTokenAccountInfo0V = await token0V.getAccountInfo(exchangeTokenAccount0V)
  //  //let walletTokenAccountInfo0V = await token0V.getAccountInfo(walletTokenAccount0V)
  //  //assert.ok(exchangeTokenAccountInfo0B.amount.eq(new anchor.BN(131)))
  //  //assert.ok(walletTokenAccountInfo0B.amount.eq(new anchor.BN(99869)))

  //  let exchangeAccountInfo0 = await exchange.account.exchangeData.fetch(exchangeAccount0.publicKey)
  //  //assert.ok(exchangeAccountInfo0.lastPrice.eq(new anchor.BN(6)))
  //})

  const unbondAmountC = 87 * (10 ** decimalsC)

  it('Exchange: Unbonds', async () => {
    const [exchangePda, exchangeBump] = await anchor.web3.PublicKey.findProgramAddress([token0V.publicKey.toBuffer()], exchange.programId);
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

  const finalMaxAmount0A = 1700 * (10 ** decimals0V)
  const finalAmount0B = 750 * (10 ** decimals0V)
  const finalMinBond0C = 340 * (10 ** decimalsC)
  const finalBondMinted0 = 350 * (10 ** decimalsC)

  it('Exchange: Bonds final', async () => {
    const deadline = new anchor.BN(Date.now() / 1000)
    const tx = await exchange.rpc.bond(
      new anchor.BN(finalMaxAmount0A),
      new anchor.BN(finalAmount0B),
      new anchor.BN(finalMinBond0C),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeV: exchangeTokenAccount0V,
          mintC: tokenC.publicKey,
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

  it('Factory: Creates second exchange', async () => {
    const fee1 = 3
    const [pda, bump] = await anchor.web3.PublicKey.findProgramAddress([token1V.publicKey.toBuffer()], exchange.programId)
    const tx = await factory.rpc.createExchange(
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
    //assert.ok(factoryAccountInfo.tokenCount.eq(new anchor.BN(1)))
  })

  const finalMaxAmount1A = 1000 * (10 ** decimals1V)
  const finalAmount1B = 1000 * (10 ** decimals1V)
  const finalMinBond1C = 0
  const finalBondMinted1 = 1000 * (10 ** decimalsC)

  it('Exchange: Bonds', async () => {
    const deadline = new anchor.BN(Date.now() / 1000)
    const tx = await exchange.rpc.bond(
      new anchor.BN(finalMaxAmount1A),
      new anchor.BN(finalAmount1B),
      new anchor.BN(finalMinBond1C),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount1.publicKey,
          exchangeV: exchangeTokenAccount1V,
          mintC: tokenC.publicKey,
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
