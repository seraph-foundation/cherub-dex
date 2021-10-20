const { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, TOKEN_PROGRAM_ID, Token } = require('@solana/spl-token');
const TokenInstructions = require('@project-serum/serum').TokenInstructions;
const anchor = require('@project-serum/anchor');
const assert = require('assert');
const fs = require('fs');
const { parsePriceData } = require('@pythnetwork/client');

const exchangeIdl = require('../target/idl/exchange.json');
const factoryIdl = require('../target/idl/factory.json');
const pythIdl = require('../target/idl/pyth.json');

const { LAMPORTS_PER_SOL, PublicKey, SystemProgram } = anchor.web3;

describe('Cherub', () => {
  anchor.setProvider(anchor.Provider.env());

  const provider = anchor.getProvider();

  const isLocalnet = provider.connection._rpcEndpoint === 'http://127.0.0.1:8899';

  const browserWalletPublicKey = new PublicKey('8iA8BGF7Fx5VT16dqu1Rbgmved7KSgpCaSEXojWgMFgp');

  const accountsFile = isLocalnet ? './app/src/accounts-localnet.json' : 'accounts-devnet.json';

  const exchange = anchor.workspace.Exchange;
  const factory = anchor.workspace.Factory;
  const pyth = anchor.workspace.Pyth;

  let mintAuthority = provider.wallet;

  // First exchange token is SOL
  let token0A;
  let token0B;

  // Second exchange token is CHRB
  let token1A;
  let token1B;

  let tokenC;
  let tokenS;

  const decimals0A = 9;
  const decimals0B = 9;
  // First exchange token vault is SOL
  const decimals0V = 9;

  const decimalsC = 9;
  const decimalsS = 9;

  const decimals1A = 9;
  const decimals1B = 9;
  // Second exchange token vault is CHRB
  const decimals1V = decimalsC;

  const exchangeAccount0 = anchor.web3.Keypair.generate();
  const exchangeAccount1 = anchor.web3.Keypair.generate();
  const factoryAccount = anchor.web3.Keypair.generate();
  const payerAccount = anchor.web3.Keypair.generate();
  const traderAccount = anchor.web3.Keypair.generate();

  let oracleFeedAccount0;
  let oracleFeedAccount1;

  let exchangeTokenAccount0A;
  let exchangeTokenAccount0B;
  let exchangeTokenAccount0V;

  let exchangeTokenAccount1A;
  let exchangeTokenAccount1B;
  let exchangeTokenAccount1V;

  let walletTokenAccountC;
  let walletTokenAccountS;

  let walletTokenAccount0A;
  let walletTokenAccount0B;
  let walletTokenAccount0V;

  let walletTokenAccount1A;
  let walletTokenAccount1B;
  let walletTokenAccount1V;

  let traderTokenAccount0A;
  let traderTokenAccount0B;
  let traderTokenAccount0V;

  let traderTokenAccount1A;
  let traderTokenAccount1B;
  let traderTokenAccount1V;

  fs.writeFileSync('./app/src/exchange.json', JSON.stringify(exchangeIdl));
  fs.writeFileSync('./app/src/factory.json', JSON.stringify(factoryIdl));
  fs.writeFileSync('./app/src/pyth.json', JSON.stringify(pythIdl));

  const amount0A = 100000 * (10 ** decimals0A);
  const amount0B = 100000 * (10 ** decimals0B);
  const amount0V = 100000 * (10 ** decimals0V);

  const amount1A = 100000 * (10 ** decimals1A);
  const amount1B = 100000 * (10 ** decimals1B);
  const amount1V = 100000 * (10 ** decimals1V);

  const traderAmount0A = 50000 * (10 ** decimals0A);
  const traderAmount0B = 50000 * (10 ** decimals0B);
  const traderAmount0V = 50000 * (10 ** decimals0V);

  const amountAirdrop = 200000 * LAMPORTS_PER_SOL;

  const Direction = {
    Long: { long: {} },
    Short: { short: {} },
  };

  const Status = {
    Open: { open: {} },
    Closed: { closed: {} },
    Liquidated: { liquidated: {} },
  };

  it('State initialized', async () => {
    // TODO: Airdrop only works on localnet?
    await provider.connection.confirmTransaction(await provider.connection.requestAirdrop(payerAccount.publicKey, amountAirdrop), 'confirmed');
    await provider.connection.confirmTransaction(await provider.connection.requestAirdrop(browserWalletPublicKey, amountAirdrop), 'confirmed');

    tokenC = await Token.createMint(provider.connection, payerAccount, mintAuthority.publicKey, null, decimalsC, TOKEN_PROGRAM_ID);
    tokenS = await Token.createMint(provider.connection, payerAccount, mintAuthority.publicKey, null, decimalsS, TOKEN_PROGRAM_ID);

    token0A = await Token.createMint(provider.connection, payerAccount, mintAuthority.publicKey, null, decimals0A, TOKEN_PROGRAM_ID);
    token0B = await Token.createMint(provider.connection, payerAccount, mintAuthority.publicKey, null, decimals0B, TOKEN_PROGRAM_ID);

    // First exchange token vault is SOL
    token0V = new Token(provider.connection, NATIVE_MINT, TOKEN_PROGRAM_ID, payerAccount);

    token1A = await Token.createMint(provider.connection, payerAccount, mintAuthority.publicKey, null, decimals1A, TOKEN_PROGRAM_ID);
    token1B = await Token.createMint(provider.connection, payerAccount, mintAuthority.publicKey, null, decimals1B, TOKEN_PROGRAM_ID);

    // Second exchange token vault is CHRB
    token1V = tokenC;

    walletTokenAccount0A = await token0A.createAssociatedTokenAccount(provider.wallet.publicKey);
    walletTokenAccount0B = await token0B.createAssociatedTokenAccount(provider.wallet.publicKey);

    // Wrap native SOL
    walletTokenAccount0V = await Token.createWrappedNativeAccount(
      provider.connection,
      TOKEN_PROGRAM_ID,
      provider.wallet.publicKey,
      payerAccount,
      amount0V
    );

    factoryTokenAccountC = await tokenC.createAccount(provider.wallet.publicKey);

    walletTokenAccountC = await tokenC.createAssociatedTokenAccount(provider.wallet.publicKey);
    walletTokenAccountS = await tokenS.createAssociatedTokenAccount(provider.wallet.publicKey);

    walletTokenAccount1A = await token1A.createAssociatedTokenAccount(provider.wallet.publicKey);
    walletTokenAccount1B = await token1B.createAssociatedTokenAccount(provider.wallet.publicKey);
    walletTokenAccount1V = walletTokenAccountC;

    exchangeTokenAccount0A = await token0A.createAccount(exchangeAccount0.publicKey);
    exchangeTokenAccount0B = await token0B.createAccount(exchangeAccount0.publicKey);
    exchangeTokenAccount0V = await token0V.createAccount(exchangeAccount0.publicKey);

    exchangeTokenAccount1A = await token1A.createAccount(exchangeAccount1.publicKey);
    exchangeTokenAccount1B = await token1B.createAccount(exchangeAccount1.publicKey);
    exchangeTokenAccount1V = await token1V.createAccount(exchangeAccount1.publicKey);

    traderTokenAccount0A = await token0A.createAssociatedTokenAccount(traderAccount.publicKey);
    traderTokenAccount0B = await token0B.createAssociatedTokenAccount(traderAccount.publicKey);
    traderTokenAccount0V = await token0V.createAssociatedTokenAccount(traderAccount.publicKey);

    await token0A.mintTo(walletTokenAccount0A, mintAuthority.publicKey, [mintAuthority.payer], amount0A);
    await token0B.mintTo(walletTokenAccount0B, mintAuthority.publicKey, [mintAuthority.payer], amount0B);
    await token0A.mintTo(traderTokenAccount0A, mintAuthority.publicKey, [mintAuthority.payer], traderAmount0A);
    await token0B.mintTo(traderTokenAccount0B, mintAuthority.publicKey, [mintAuthority.payer], traderAmount0B);
    await token1A.mintTo(walletTokenAccount1A, mintAuthority.publicKey, [mintAuthority.payer], amount1A);
    await token1B.mintTo(walletTokenAccount1B, mintAuthority.publicKey, [mintAuthority.payer], amount1B);

    oracleFeedAccount0 = new anchor.web3.Account();
    oracleFeedAccount1 = new anchor.web3.Account();

    // Useful for Anchor CLI and app
    fs.writeFileSync(accountsFile, JSON.stringify({
      exchanges: [{
        account: exchangeAccount0.publicKey.toString(),
        accountA: exchangeTokenAccount0A.toString(),
        accountB: exchangeTokenAccount0B.toString(),
        accountV: exchangeTokenAccount0V.toString(),
        oracle: oracleFeedAccount0.publicKey.toString(),
        symbol: 'SOL',
        tokenA: token0A.publicKey.toString(),
        tokenB: token0B.publicKey.toString(),
        tokenV: token0V.publicKey.toString()
      }, {
        account: exchangeAccount1.publicKey.toString(),
        accountA: exchangeTokenAccount1A.toString(),
        accountB: exchangeTokenAccount1B.toString(),
        accountV: exchangeTokenAccount1V.toString(),
        oracle: oracleFeedAccount1.publicKey.toString(),
        symbol: 'CHRB',
        tokenA: token1A.publicKey.toString(),
        tokenB: token1B.publicKey.toString(),
        tokenV: token1V.publicKey.toString()
      }],
      factory: {
        account: factoryAccount.publicKey.toString(),
        accountC: factoryTokenAccountC.toString(),
        tokenC: tokenC.publicKey.toString(),
        tokenS: tokenS.publicKey.toString()
      }
    }));

    let walletTokenAccountInfoA = await token0A.getAccountInfo(walletTokenAccount0A);
    let walletTokenAccountInfoB = await token0B.getAccountInfo(walletTokenAccount0B);
    let walletTokenAccountInfoV = await token0V.getAccountInfo(walletTokenAccount0V);
    assert.ok(walletTokenAccountInfoA.amount.toNumber() == amount0A);
    assert.ok(walletTokenAccountInfoB.amount.toNumber() == amount0B);
    assert.ok(walletTokenAccountInfoV.amount.toNumber() == amount0V);

    let exchangeTokenAccountInfoA = await token0A.getAccountInfo(exchangeTokenAccount0A);
    let exchangeTokenAccountInfoB = await token0B.getAccountInfo(exchangeTokenAccount0B);
    assert.ok(exchangeTokenAccountInfoA.amount.toNumber() == 0);
    assert.ok(exchangeTokenAccountInfoB.amount.toNumber() == 0);

    let traderTokenAccountInfoA = await token0A.getAccountInfo(traderTokenAccount0A);
    let traderTokenAccountInfoB = await token0B.getAccountInfo(traderTokenAccount0B);
    assert.ok(traderTokenAccountInfoA.amount.toNumber() == traderAmount0A);
    assert.ok(traderTokenAccountInfoB.amount.toNumber() == traderAmount0B);

    let tokenInfo0A = await token0A.getMintInfo();
    assert.ok(tokenInfo0A.supply.toNumber() == traderAmount0A + amount0A);

    let tokenInfo0B = await token0B.getMintInfo();
    assert.ok(tokenInfo0B.supply.toNumber() == traderAmount0B + amount0B);

    let tokenInfoC = await tokenC.getMintInfo();
    assert.ok(tokenInfoC.supply.toNumber() == 0);
  });

  it('Initializes first Pyth oracle', async () => {
    const oracleInitPrice = 681.47;
    const oracleConf = 0;
    const oracleExpo = -9;
    const tx = await pyth.rpc.initialize(
      new anchor.BN(oracleInitPrice).mul(new anchor.BN(10).pow(new anchor.BN(-oracleExpo))),
      oracleExpo,
      new anchor.BN(oracleConf), {
        accounts: {
          price: oracleFeedAccount0.publicKey
        },
        instructions: [
          anchor.web3.SystemProgram.createAccount({
            fromPubkey: pyth.provider.wallet.publicKey,
            newAccountPubkey: oracleFeedAccount0.publicKey,
            space: 3312,
            lamports: await pyth.provider.connection.getMinimumBalanceForRentExemption(3312),
            programId: pyth.programId
          })
        ],
        signers: [oracleFeedAccount0]
      });

    console.log('Your transaction signature', tx);

    const oracleFeedAccountInfo0 = await pyth.provider.connection.getAccountInfo(oracleFeedAccount0.publicKey);
    assert.ok(new anchor.BN(parsePriceData(oracleFeedAccountInfo0.data).price).eq(new anchor.BN(oracleInitPrice)));
  });

  it('Initializes second Pyth oracle', async () => {
    const oracleInitPrice = 903.49;
    const oracleConf = 0;
    const oracleExpo = -9;
    const tx = await pyth.rpc.initialize(
      new anchor.BN(oracleInitPrice).mul(new anchor.BN(10).pow(new anchor.BN(-oracleExpo))),
      oracleExpo,
      new anchor.BN(oracleConf), {
        accounts: {
          price: oracleFeedAccount1.publicKey
        },
        instructions: [
          anchor.web3.SystemProgram.createAccount({
            fromPubkey: pyth.provider.wallet.publicKey,
            newAccountPubkey: oracleFeedAccount1.publicKey,
            space: 3312,
            lamports: await pyth.provider.connection.getMinimumBalanceForRentExemption(3312),
            programId: pyth.programId
          })
        ],
        signers: [oracleFeedAccount1]
      });

    console.log('Your transaction signature', tx);

    const oracleFeedAccountInfo1 = await pyth.provider.connection.getAccountInfo(oracleFeedAccount1.publicKey);
    assert.ok(new anchor.BN(parsePriceData(oracleFeedAccountInfo1.data).price).eq(new anchor.BN(oracleInitPrice)));
  });

  // TODO: Finish this (https://github.com/Synthetify/synthetify-protocol/search?p=3&q=pyth)
  it('Set first oracle feed', async() => {
    //const tx = await pyth.rpc.setPrice(new BN(newPrice * 10 ** -data.exponent), {
    //  accounts: { price: priceFeed }
    //});
  });

  it('Factory initialized', async () => {
    const tx = await factory.rpc.initialize(exchange.programId, {
      accounts: {
        authority: provider.wallet.publicKey,
        factory: factoryAccount.publicKey,
        systemProgram: SystemProgram.programId
      },
      signers: [factoryAccount]
    });

    console.log('Your transaction signature', tx);

    let factoryAccountInfo = await factory.account.factoryData.fetch(factoryAccount.publicKey)
    assert.ok(factoryAccountInfo.tokenCount.eq(new anchor.BN(0)));
    assert.ok(factoryAccountInfo.exchangeTemplate.toString() == exchange.programId.toString());
  });

  it('Factory exchange created', async () => {
    const [pda, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode('exchange'))],
      exchange.programId
    );
    const fee = new anchor.BN(3);
    const tx = await factory.rpc.createExchange(
      token0A.publicKey,
      token0B.publicKey,
      tokenC.publicKey,
      fee, {
        accounts: {
          exchange: exchangeAccount0.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          exchangeProgram: exchange.programId,
          factory: factoryAccount.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID
        },
        instructions: [await exchange.account.exchangeData.createInstruction(exchangeAccount0)],
        signers: [factoryAccount.owner, exchangeAccount0]
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccountInfo0A = await token0A.getAccountInfo(exchangeTokenAccount0A);
    assert.ok(exchangeTokenAccountInfo0A.amount.eq(new anchor.BN(0)));

    let exchangeTokenAccountInfo0B = await token0B.getAccountInfo(exchangeTokenAccount0B);
    assert.ok(exchangeTokenAccountInfo0B.amount.eq(new anchor.BN(0)));
    assert.ok(exchangeTokenAccountInfo0A.owner.equals(pda));
    assert.ok(exchangeTokenAccountInfo0B.owner.equals(pda));

    let factoryAccountInfo = await factory.account.factoryData.fetch(factoryAccount.publicKey)
    assert.ok(factoryAccountInfo.tokenCount.eq(new anchor.BN(1)));
  });

  const initialMaxAmountA = 10000 * (10 ** decimals0A);
  const initialAmountB = 5000 * (10 ** decimals0B);
  const initialMinBondC = 0;
  const initialBondMinted = 5000 * (10 ** decimalsC);

  it('Initial bond', async () => {
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.bond(
      new anchor.BN(initialMaxAmountA),
      new anchor.BN(initialAmountB),
      new anchor.BN(initialMinBondC),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          exchangeV: exchangeTokenAccount0V,
          mint: tokenC.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          userA: walletTokenAccount0A,
          userB: walletTokenAccount0B,
          userC: walletTokenAccountC,
          userV: walletTokenAccount0V
        }
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccountInfo0A = await token0A.getAccountInfo(exchangeTokenAccount0A);
    let walletTokenAccountInfo0A = await token0A.getAccountInfo(walletTokenAccount0A);
    assert.ok(exchangeTokenAccountInfo0A.amount.eq(new anchor.BN(initialMaxAmountA)));
    assert.ok(walletTokenAccountInfo0A.amount.eq(new anchor.BN(amount0A - initialMaxAmountA)));

    let exchangeTokenAccountInfo0B = await token0B.getAccountInfo(exchangeTokenAccount0B);
    let walletTokenAccountInfo0B = await token0B.getAccountInfo(walletTokenAccount0B);
    assert.ok(exchangeTokenAccountInfo0B.amount.eq(new anchor.BN(initialAmountB)));
    assert.ok(walletTokenAccountInfo0B.amount.eq(new anchor.BN(amount0B - initialAmountB)));

    let walletTokenAccountInfoC = await tokenC.getAccountInfo(walletTokenAccountC);
    assert.ok(walletTokenAccountInfoC.amount.eq(new anchor.BN(initialBondMinted)));
  });

  const stakeAmount = initialBondMinted / 2;

  it('Stake', async () => {
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
    );

    console.log('Your transaction signature', tx);

    let factoryTokenAccountInfoC = await tokenC.getAccountInfo(factoryTokenAccountC);
    assert.ok(factoryTokenAccountInfoC.amount.eq(new anchor.BN(stakeAmount)));

    let walletTokenAccountInfoC = await tokenC.getAccountInfo(walletTokenAccountC);
    let walletTokenAccountInfoS = await tokenS.getAccountInfo(walletTokenAccountS);
    assert.ok(walletTokenAccountInfoC.amount.eq(new anchor.BN(initialBondMinted - stakeAmount)));
    assert.ok(walletTokenAccountInfoS.amount.eq(new anchor.BN(stakeAmount)));
  });

  const additionalMaxAmountA = 1500 * (10 ** decimals0A);
  const additionalAmountB = 750 * (10 ** decimals0B);
  const additionalMinBondC = 375 * (10 ** decimalsC);
  const additionalBondMinted = 375 * (10 ** decimalsC);

  it('Additional bond', async () => {
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.bond(
      new anchor.BN(additionalMaxAmountA),
      new anchor.BN(additionalAmountB),
      new anchor.BN(additionalMinBondC),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          exchangeV: exchangeTokenAccount0V,
          mint: tokenC.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          userA: walletTokenAccount0A,
          userB: walletTokenAccount0B,
          userC: walletTokenAccountC,
          userV: walletTokenAccount0V
        }
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccountInfo0A = await token0A.getAccountInfo(exchangeTokenAccount0A);
    let walletTokenAccountInfo0A = await token0A.getAccountInfo(walletTokenAccount0A);
    //assert.ok(exchangeTokenAccountInfo0A.amount.eq(new anchor.BN(initialMaxAmountA + additionalMaxAmountA)));
    //assert.ok(walletTokenAccountInfo0A.amount.eq(new anchor.BN(amount0A - initialMaxAmountA - additionalMaxAmountA)));

    let exchangeTokenAccountInfo0B = await token0B.getAccountInfo(exchangeTokenAccount0B);
    let walletTokenAccountInfo0B = await token0B.getAccountInfo(walletTokenAccount0B);
    //assert.ok(exchangeTokenAccountInfo0B.amount.eq(new anchor.BN(initialAmountB + additionalAmountB)));
    //assert.ok(walletTokenAccountInfo0B.amount.eq(new anchor.BN(amount0B - initialAmountB - additionalAmountB)));

    let walletTokenAccountInfoC = await tokenC.getAccountInfo(walletTokenAccountC);
    //assert.ok(walletTokenAccountInfoC.amount.eq(new anchor.BN(initialBondMinted + additionalBondMinted)));
  });

  const traderInputQuoteAccount = anchor.web3.Keypair.generate();
  const aToBAmount = 10 * (10 ** decimals0A);

  it('Get input price', async () => {
    const tx = await exchange.rpc.getBToAInputPrice(
      new anchor.BN(aToBAmount),
      {
        accounts: {
          authority: provider.wallet.publicKey,
          exchange: exchangeAccount0.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          quote: traderInputQuoteAccount.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [traderInputQuoteAccount]
      });

    console.log('Your transaction signature', tx);

    let traderInputAccountQuoteInfo = await exchange.account.quote.fetch(traderInputQuoteAccount.publicKey);
    //assert.ok(traderInputAccountQuoteInfo.price.eq(new anchor.BN(48 ** decimals0B)));
  });

  const traderOutputQuoteAccount = anchor.web3.Keypair.generate();
  const bToAAmount = 5 * (10 ** decimals0B);

  it('Get output price', async () => {
    const tx = await exchange.rpc.getBToAOutputPrice(
      new anchor.BN(bToAAmount),
      {
        accounts: {
          authority: provider.wallet.publicKey,
          exchange: exchangeAccount0.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          quote: traderOutputQuoteAccount.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [traderOutputQuoteAccount]
      });

    console.log('Your transaction signature', tx);

    let traderOutputQuoteAccountInfo = await exchange.account.quote.fetch(traderOutputQuoteAccount.publicKey);
    //assert.ok(traderOutputQuoteAccountInfo.price.eq(new anchor.BN(4)));
  });

  const bToAAmountB = 6 * (10 ** decimals0B);
  const exchangePositionAccount0 = anchor.web3.Keypair.generate();

  it('B to A input', async () => {
    const [pda, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode('exchange'))],
      exchange.programId
    );
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.bToAInput(
      new anchor.BN(bToAAmountB),
      deadline,
      Direction.Long,
      new anchor.BN(bToAAmountB),
      {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          exchangeV: exchangeTokenAccount0V,
          mintA: token0A.publicKey,
          mintB: token0B.publicKey,
          pda,
          position: exchangePositionAccount0.publicKey,
          recipient: walletTokenAccount0A,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          userV: walletTokenAccount0V
        },
        signers: [exchangePositionAccount0]
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccountInfo0A = await token0A.getAccountInfo(exchangeTokenAccount0A);
    let walletTokenAccountInfo0A = await token0A.getAccountInfo(walletTokenAccount0A);
    //assert.ok(exchangeTokenAccountInfo0A.amount.eq(new anchor.BN(218)));
    //assert.ok(walletTokenAccountInfo0A.amount.eq(new anchor.BN(99782)));

    let exchangeTokenAccountInfo0B = await token0B.getAccountInfo(exchangeTokenAccount0B);
    let walletTokenAccountInfo0B = await token0B.getAccountInfo(walletTokenAccount0B);
    //assert.ok(exchangeTokenAccountInfo0B.amount.eq(new anchor.BN(131)));
    //assert.ok(walletTokenAccountInfo0B.amount.eq(new anchor.BN(99869)));

    let exchangeAccountInfo0 = await exchange.account.exchangeData.fetch(exchangeAccount0.publicKey)
    //assert.ok(exchangeAccountInfo0.lastPrice.eq(new anchor.BN(6)));
  });

  const aToBAmountA = 3 * (10 ** decimals0A);
  const exchangePositionAccount1 = anchor.web3.Keypair.generate();

  it('A to B input', async () => {
    const [pda, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode('exchange'))],
      exchange.programId
    );
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.aToBInput(
      new anchor.BN(aToBAmountA),
      deadline,
      Direction.Short,
      new anchor.BN(aToBAmountA),
      {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          exchangeV: exchangeTokenAccount0V,
          mintA: token0A.publicKey,
          mintB: token0B.publicKey,
          pda,
          position: exchangePositionAccount1.publicKey,
          recipient: walletTokenAccount0A,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          userV: walletTokenAccount0V
        },
        signers: [exchangePositionAccount1]
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccount0AInfo = await token0A.getAccountInfo(exchangeTokenAccount0A);
    let walletTokenAccount0AInfo = await token0A.getAccountInfo(walletTokenAccount0A);
    //assert.ok(exchangeTokenAccount0AInfo.amount.eq(new anchor.BN(206)));
    //assert.ok(walletTokenAccount0AInfo.amount.eq(new anchor.BN(99794)));

    let exchangeTokenAccount0BInfo = await token0B.getAccountInfo(exchangeTokenAccount0B);
    let walletTokenAccount0BInfo = await token0B.getAccountInfo(walletTokenAccount0B);
    //assert.ok(exchangeTokenAccount0BInfo.amount.eq(new anchor.BN(150)));
    //assert.ok(walletTokenAccount0BInfo.amount.eq(new anchor.BN(99850)));

    let exchangeAccount0Info = await exchange.account.exchangeData.fetch(exchangeAccount0.publicKey)
    //assert.ok(exchangeAccount0Info.lastPrice.eq(new anchor.BN(19)));
  });

  const unbondAmountC = 87;

  it('Unbond', async () => {
    const [pda, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode('exchange'))],
      exchange.programId
    );
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.unbond(
      new anchor.BN(unbondAmountC),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          mint: tokenC.publicKey,
          pda,
          tokenProgram: TOKEN_PROGRAM_ID,
          userA: walletTokenAccount0A,
          userB: walletTokenAccount0B,
          userC: walletTokenAccountC
        }
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccount0AInfo = await token0A.getAccountInfo(exchangeTokenAccount0A);
    let walletTokenAccount0AInfo = await token0A.getAccountInfo(walletTokenAccount0A);
    //assert.ok(exchangeTokenAccount0AInfo.amount.eq(new anchor.BN(0)));
    //assert.ok(walletTokenAccount0AInfo.amount.eq(new anchor.BN(amount0A)));

    let exchangeTokenAccount0BInfo = await token0B.getAccountInfo(exchangeTokenAccount0B);
    let walletTokenAccount0BInfo = await token0B.getAccountInfo(walletTokenAccount0B);
    //assert.ok(exchangeTokenAccount0BInfo.amount.eq(new anchor.BN(0)));
    //assert.ok(walletTokenAccount0BInfo.amount.eq(new anchor.BN(amount0B)));

    let walletTokenAccountCInfo = await tokenC.getAccountInfo(walletTokenAccountC);
    //assert.ok(walletTokenAccountCInfo.amount.eq(new anchor.BN(0)));
  });

  const finalMaxAmount0A = 1600 * (10 ** decimals0A);
  const finalAmount0B = 750 * (10 ** decimals0B);
  const finalMinBond0C = 340 * (10 ** decimalsC);
  const finalBondMinted0 = 350 * (10 ** decimalsC);

  it('Bond final', async () => {
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.bond(
      new anchor.BN(finalMaxAmount0A),
      new anchor.BN(finalAmount0B),
      new anchor.BN(finalMinBond0C),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount0.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          exchangeV: exchangeTokenAccount0V,
          mint: tokenC.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          userA: walletTokenAccount0A,
          userB: walletTokenAccount0B,
          userC: walletTokenAccountC,
          userV: walletTokenAccount0V
        }
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccount0AInfo = await token0A.getAccountInfo(exchangeTokenAccount0A);
    let walletTokenAccount0AInfo = await token0A.getAccountInfo(walletTokenAccount0A);
    //assert.ok(exchangeTokenAccount0AInfo.amount.eq(new anchor.BN(additionalMaxAmountA)));
    //assert.ok(walletTokenAccount0AInfo.amount.eq(new anchor.BN(99850)));

    let exchangeTokenAccount0BInfo = await token0B.getAccountInfo(exchangeTokenAccount0B);
    let walletTokenAccount0BInfo = await token0B.getAccountInfo(walletTokenAccount0B);
    //assert.ok(walletTokenAccount0BInfo.amount.eq(new anchor.BN(99925)));

    let walletTokenAccountCInfo = await tokenC.getAccountInfo(walletTokenAccountC);
    //assert.ok(walletTokenAccountCInfo.amount.eq(new anchor.BN(75)));
  });

  it('Factory second exchange created', async () => {
    const [pda, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode('exchange'))],
      exchange.programId
    );
    const fee = new anchor.BN(3);
    const tx = await factory.rpc.createExchange(
      token1A.publicKey,
      token1B.publicKey,
      tokenC.publicKey,
      fee, {
        accounts: {
          exchange: exchangeAccount1.publicKey,
          exchangeA: exchangeTokenAccount1A,
          exchangeB: exchangeTokenAccount1B,
          exchangeProgram: exchange.programId,
          factory: factoryAccount.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID
        },
        instructions: [await exchange.account.exchangeData.createInstruction(exchangeAccount1)],
        signers: [factoryAccount.owner, exchangeAccount1]
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccount0AInfo = await token0A.getAccountInfo(exchangeTokenAccount0A);
    //assert.ok(exchangeTokenAccount0AInfo.amount.eq(new anchor.BN(0)));

    let exchangeTokenAccount0BInfo = await token0B.getAccountInfo(exchangeTokenAccount0B);
    //assert.ok(exchangeTokenAccount0BInfo.amount.eq(new anchor.BN(0)));
    //assert.ok(exchangeTokenAccount0AInfo.owner.equals(pda));
    //assert.ok(exchangeTokenAccount0BInfo.owner.equals(pda));

    let factoryAccountInfo = await factory.account.factoryData.fetch(factoryAccount.publicKey)
    //assert.ok(factoryAccountInfo.tokenCount.eq(new anchor.BN(1)));
  });

  const finalMaxAmount1A = 1000 * (10 ** decimals1A);
  const finalAmount1B = 1000 * (10 ** decimals1B);
  const finalMinBond1C = 0;
  const finalBondMinted1 = 1000 * (10 ** decimalsC);

  it('Second exchange initial bond', async () => {
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.bond(
      new anchor.BN(finalMaxAmount1A),
      new anchor.BN(finalAmount1B),
      new anchor.BN(finalMinBond1C),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount1.publicKey,
          exchangeA: exchangeTokenAccount1A,
          exchangeB: exchangeTokenAccount1B,
          exchangeV: exchangeTokenAccount1V,
          mint: tokenC.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          userA: walletTokenAccount1A,
          userB: walletTokenAccount1B,
          userC: walletTokenAccountC,
          userV: walletTokenAccount1V
        }
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccount1AInfo = await token1A.getAccountInfo(exchangeTokenAccount1A);
    let walletTokenAccount1AInfo = await token1A.getAccountInfo(walletTokenAccount1A);
    assert.ok(exchangeTokenAccount1AInfo.amount.eq(new anchor.BN(finalMaxAmount1A)));
    assert.ok(walletTokenAccount1AInfo.amount.eq(new anchor.BN(amount1A - finalMaxAmount1A)));

    let exchangeTokenAccount1BInfo = await token1B.getAccountInfo(exchangeTokenAccount1B);
    let walletTokenAccount1BInfo = await token1B.getAccountInfo(walletTokenAccount1B);
    assert.ok(exchangeTokenAccount1BInfo.amount.eq(new anchor.BN(finalAmount1B)));
    assert.ok(walletTokenAccount1BInfo.amount.eq(new anchor.BN(amount1B - finalAmount1B)));

    let walletTokenAccountCInfo = await tokenC.getAccountInfo(walletTokenAccountC);
    //assert.ok(walletTokenAccountCInfo.amount.eq(new anchor.BN(finalBondMinted1)));
  });
});
