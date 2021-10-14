const anchor = require('@project-serum/anchor');
const assert = require('assert');
const fs = require('fs');
const { TOKEN_PROGRAM_ID, Token } = require('@solana/spl-token');
const TokenInstructions = require('@project-serum/serum').TokenInstructions;

const exchangeIdl = require('../target/idl/exchange.json');
const factoryIdl = require('../target/idl/factory.json');
const pythIdl = require('../target/idl/pyth.json');

const { LAMPORTS_PER_SOL, PublicKey, SystemProgram } = anchor.web3;

describe('Cherub', () => {
  anchor.setProvider(anchor.Provider.env());

  const provider = anchor.getProvider();

  const isLocalnet = provider.connection._rpcEndpoint === 'http://127.0.0.1:8899';

  const solDecimals = 9;
  const solMintPublicKey = new PublicKey('So11111111111111111111111111111111111111112');

  const browserWalletPublicKey = new PublicKey('292g43tSj4jVq7VKJLZ51DKvxTT5RxQkZ1YwryqgRvN2');

  const accountsFile = isLocalnet ? './app/src/accounts-localnet.json' : 'accounts.json';

  const exchange = anchor.workspace.Exchange;
  const factory = anchor.workspace.Factory;
  const pyth = anchor.workspace.Pyth;

  let mintAuthority = provider.wallet;

  // TODO: These mint variables are really Token objects so should be renamed
  let mintC = null;

  // First exchange is SOL
  let mint0A = null;
  let mint0B = null;

  // Second exchange is CHRB
  let mint1A = null;
  let mint1B = null;
  let mint1C = null;

  const decimalsC = 6;

  const decimals0A = 6;
  const decimals0B = 6;
  const decimals0V = solDecimals;

  // Second exchange is CHRB
  const decimals1A = 6;
  const decimals1B = 6;
  const decimals1V = decimalsC;

  const exchange0Account = anchor.web3.Keypair.generate();
  const exchange1Account = anchor.web3.Keypair.generate();
  const factoryAccount = anchor.web3.Keypair.generate();
  const payerAccount = anchor.web3.Keypair.generate();
  const pythAccount = anchor.web3.Keypair.generate();
  const traderAccount = anchor.web3.Keypair.generate();

  let exchangeTokenAccount0A = null;
  let exchangeTokenAccount0B = null;
  let exchangeTokenAccount0V = null;

  let exchangeTokenAccount1A = null;
  let exchangeTokenAccount1B = null;
  let exchangeTokenAccount1V = null;

  let walletTokenAccountC = null;

  let walletTokenAccount0A = null;
  let walletTokenAccount0B = null;
  let walletTokenAccount0V = null;

  let walletTokenAccount1A = null;
  let walletTokenAccount1B = null;
  let walletTokenAccount1V = null;

  let traderTokenAccountC = null;

  let traderTokenAccount0A = null;
  let traderTokenAccount0B = null;
  let traderTokenAccount0V = null;

  let traderTokenAccount1A = null;
  let traderTokenAccount1B = null;
  let traderTokenAccount1V = null;

  fs.writeFileSync('./app/src/exchange.json', JSON.stringify(exchangeIdl));
  fs.writeFileSync('./app/src/factory.json', JSON.stringify(factoryIdl));
  fs.writeFileSync('./app/src/pyth.json', JSON.stringify(pythIdl));

  const amount0A = 1000000 * (10 ** decimals0B);
  const amount0B = 1000000 * (10 ** decimals0B);
  const amount0V = 1000000 * (10 ** decimals0B);

  const amount1A = 9000000 * (10 ** decimals1A);
  const amount1B = 9000000 * (10 ** decimals1B);
  const amount1V = 9000000 * (10 ** decimals1B);

  const traderAmount0A = 500 * (10 ** decimals0B);
  const traderAmount0B = 500 * (10 ** decimals0B);
  const traderAmount0V = 500 * (10 ** decimals0B);

  const amountAirdrop = 50 * LAMPORTS_PER_SOL;

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
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(payerAccount.publicKey, amountAirdrop),
      'confirmed'
    );

      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(browserWalletPublicKey, amountAirdrop),
        'confirmed'
      );

    const solToken = new Token(provider.connection, solMintPublicKey, TOKEN_PROGRAM_ID, payerAccount);

    mintC = await Token.createMint(
      provider.connection,
      payerAccount,
      mintAuthority.publicKey,
      null,
      decimalsC,
      TOKEN_PROGRAM_ID
    );

    mint0A = await Token.createMint(
      provider.connection,
      payerAccount,
      mintAuthority.publicKey,
      null,
      decimals0A,
      TOKEN_PROGRAM_ID
    );

    mint0B = await Token.createMint(
      provider.connection,
      payerAccount,
      mintAuthority.publicKey,
      null,
      decimals0B,
      TOKEN_PROGRAM_ID
    );

    mint1A = await Token.createMint(
      provider.connection,
      payerAccount,
      mintAuthority.publicKey,
      null,
      decimals1A,
      TOKEN_PROGRAM_ID
    );

    mint1B = await Token.createMint(
      provider.connection,
      payerAccount,
      mintAuthority.publicKey,
      null,
      decimals1B,
      TOKEN_PROGRAM_ID
    );

    // First exchange is SOL
    mint0V = solToken
    // Second exchange is CHRB
    mint1V = mintC

    walletTokenAccount0A = await mint0A.createAccount(provider.wallet.publicKey);
    walletTokenAccount0B = await mint0B.createAccount(provider.wallet.publicKey);
    // First exchange is SOL
    walletTokenAccount0V = provider.wallet.publicKey;

    walletTokenAccount1A = await mint1A.createAccount(provider.wallet.publicKey);
    walletTokenAccount1B = await mint1B.createAccount(provider.wallet.publicKey);
    walletTokenAccount1V = await mint1V.createAccount(provider.wallet.publicKey);

    exchangeTokenAccount0A = await mint0A.createAccount(exchange0Account.publicKey);
    exchangeTokenAccount0B = await mint0B.createAccount(exchange0Account.publicKey);
    exchangeTokenAccount0V = await mint0V.createAccount(exchange0Account.publicKey);

    exchangeTokenAccount1A = await mint1A.createAccount(exchange1Account.publicKey);
    exchangeTokenAccount1B = await mint1B.createAccount(exchange1Account.publicKey);
    exchangeTokenAccount1V = await mint1V.createAccount(exchange1Account.publicKey);

    traderTokenAccount0A = await mint0A.createAccount(traderAccount.publicKey);
    traderTokenAccount0B = await mint0B.createAccount(traderAccount.publicKey);
    traderTokenAccount0V = await mint0V.createAccount(traderAccount.publicKey);

    walletTokenAccountC = await mintC.createAccount(provider.wallet.publicKey);

    await mint0A.mintTo(
      walletTokenAccount0A,
      mintAuthority.publicKey,
      [mintAuthority.payer],
      amount0A
    );

    await mint0B.mintTo(
      walletTokenAccount0B,
      mintAuthority.publicKey,
      [mintAuthority.payer],
      amount0B
    );

    await mint0A.mintTo(
      traderTokenAccount0A,
      mintAuthority.publicKey,
      [mintAuthority.payer],
      traderAmount0A
    );

    await mint0B.mintTo(
      traderTokenAccount0B,
      mintAuthority.publicKey,
      [mintAuthority.payer],
      traderAmount0B
    );

    // Useful for Anchor CLI and app
    fs.writeFileSync(accountsFile, JSON.stringify({
      exchanges: [{
        exchange: exchange0Account.publicKey.toString(),
        index: 0,
        mintA: mint0A.publicKey.toString(),
        mintB: mint0B.publicKey.toString(),
        mintV: mint0V.publicKey.toString(),
        name: 'SOL',
        tokenA: exchangeTokenAccount0A.toString(),
        tokenB: exchangeTokenAccount0B.toString(),
        tokenV: exchangeTokenAccount0V.toString(),
        walletA: walletTokenAccount0A.toString(),
        walletB: walletTokenAccount0B.toString(),
        walletV: walletTokenAccount0V.toString(),
        token: mint0V.publicKey.toString()
      }, {
        exchange: exchange1Account.publicKey.toString(),
        index: 1,
        mintA: mint1A.publicKey.toString(),
        mintB: mint1B.publicKey.toString(),
        mintV: mint1V.publicKey.toString(),
        name: 'CHRB',
        tokenA: exchangeTokenAccount1A.toString(),
        tokenB: exchangeTokenAccount1B.toString(),
        tokenV: exchangeTokenAccount1V.toString(),
        walletA: walletTokenAccount1A.toString(),
        walletB: walletTokenAccount1B.toString(),
        walletV: walletTokenAccount1V.toString(),
        token: mintC.publicKey.toString()
      }],
      factory: factoryAccount.publicKey.toString(),
      mintC: mintC.publicKey.toString(),
      pyth: pythAccount.publicKey.toString(),
      trader: traderAccount.publicKey.toString()
    }));

    let walletTokenAccountInfoA = await mint0A.getAccountInfo(walletTokenAccount0A);
    let walletTokenAccountInfoB = await mint0B.getAccountInfo(walletTokenAccount0B);

    assert.ok(walletTokenAccountInfoA.amount.toNumber() == amount0A);
    assert.ok(walletTokenAccountInfoB.amount.toNumber() == amount0B);

    let exchangeTokenAccountInfoA = await mint0A.getAccountInfo(exchangeTokenAccount0A);
    let exchangeTokenAccountInfoB = await mint0B.getAccountInfo(exchangeTokenAccount0B);

    assert.ok(exchangeTokenAccountInfoA.amount.toNumber() == 0);
    assert.ok(exchangeTokenAccountInfoB.amount.toNumber() == 0);

    let traderTokenAccountInfoA = await mint0A.getAccountInfo(traderTokenAccount0A);
    let traderTokenAccountInfoB = await mint0B.getAccountInfo(traderTokenAccount0B);

    assert.ok(traderTokenAccountInfoA.amount.toNumber() == traderAmount0A);
    assert.ok(traderTokenAccountInfoB.amount.toNumber() == traderAmount0B);

    let mint0AInfo = await mint0A.getMintInfo();

    assert.ok(mint0AInfo.supply.toNumber() == traderAmount0A + amount0A);

    let mint0BInfo = await mint0B.getMintInfo();

    assert.ok(mint0BInfo.supply.toNumber() == traderAmount0B + amount0B);

    let mintCInfo = await mintC.getMintInfo();

    assert.ok(mintCInfo.supply.toNumber() == 0);
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
      mint0A.publicKey,
      mint0B.publicKey,
      mintC.publicKey,
      fee, {
        accounts: {
          exchange: exchange0Account.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          exchangeProgram: exchange.programId,
          factory: factoryAccount.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID
        },
        instructions: [await exchange.account.exchangeData.createInstruction(exchange0Account)],
        signers: [factoryAccount.owner, exchange0Account]
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccount0AInfo = await mint0A.getAccountInfo(exchangeTokenAccount0A);

    assert.ok(exchangeTokenAccount0AInfo.amount.eq(new anchor.BN(0)));

    let exchangeTokenAccount0BInfo = await mint0B.getAccountInfo(exchangeTokenAccount0B);

    assert.ok(exchangeTokenAccount0BInfo.amount.eq(new anchor.BN(0)));
    assert.ok(exchangeTokenAccount0AInfo.owner.equals(pda));
    assert.ok(exchangeTokenAccount0BInfo.owner.equals(pda));

    let factoryAccountInfo = await factory.account.factoryData.fetch(factoryAccount.publicKey)

    assert.ok(factoryAccountInfo.tokenCount.eq(new anchor.BN(1)));
  });

  const initialMaxAmountA = 100 * (10 ** decimals0A);
  const initialAmountB = 50 * (10 ** decimals0B);
  const initialMinLiquidityC = 0;
  const initialLiquidityMinted = 50 * (10 ** decimalsC);

  it('Add initial liquidity', async () => {
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.addLiquidity(
      new anchor.BN(initialMaxAmountA),
      new anchor.BN(initialAmountB),
      new anchor.BN(initialMinLiquidityC),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchange0Account.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          mint: mintC.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          userA: walletTokenAccount0A,
          userB: walletTokenAccount0B,
          userC: walletTokenAccountC
        },
        signers: [provider.wallet.owner]
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccount0AInfo = await mint0A.getAccountInfo(exchangeTokenAccount0A);
    let walletTokenAccount0AInfo = await mint0A.getAccountInfo(walletTokenAccount0A);

    assert.ok(exchangeTokenAccount0AInfo.amount.eq(new anchor.BN(initialMaxAmountA)));
    assert.ok(walletTokenAccount0AInfo.amount.eq(new anchor.BN(amount0A - initialMaxAmountA)));

    let exchangeTokenAccount0BInfo = await mint0B.getAccountInfo(exchangeTokenAccount0B);
    let walletTokenAccount0BInfo = await mint0B.getAccountInfo(walletTokenAccount0B);

    assert.ok(exchangeTokenAccount0BInfo.amount.eq(new anchor.BN(initialAmountB)));
    assert.ok(walletTokenAccount0BInfo.amount.eq(new anchor.BN(amount0B - initialAmountB)));

    let walletTokenAccountCInfo = await mintC.getAccountInfo(walletTokenAccountC);

    assert.ok(walletTokenAccountCInfo.amount.eq(new anchor.BN(initialLiquidityMinted)));
  });

  const additionalMaxAmountA = 150 * (10 ** decimals0A);
  const additionalAmountB = 75 * (10 ** decimals0B);
  const additionalMinLiquidityC = 5 * (10 ** decimalsC);
  const additionalLiquidityMinted = 37 * (10 ** decimalsC);

  it('Add additional liquidity', async () => {
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.addLiquidity(
      new anchor.BN(additionalMaxAmountA),
      new anchor.BN(additionalAmountB),
      new anchor.BN(additionalMinLiquidityC),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchange0Account.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          mint: mintC.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          userA: walletTokenAccount0A,
          userB: walletTokenAccount0B,
          userC: walletTokenAccountC
        },
        signers: [provider.wallet.owner]
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccount0AInfo = await mint0A.getAccountInfo(exchangeTokenAccount0A);
    let walletTokenAccount0AInfo = await mint0A.getAccountInfo(walletTokenAccount0A);

    //assert.ok(exchangeTokenAccount0AInfo.amount.eq(new anchor.BN(initialMaxAmountA + additionalMaxAmountA)));
    //assert.ok(walletTokenAccount0AInfo.amount.eq(new anchor.BN(amount0A - initialMaxAmountA - additionalMaxAmountA)));

    let exchangeTokenAccount0BInfo = await mint0B.getAccountInfo(exchangeTokenAccount0B);
    let walletTokenAccount0BInfo = await mint0B.getAccountInfo(walletTokenAccount0B);

    //assert.ok(exchangeTokenAccount0BInfo.amount.eq(new anchor.BN(initialAmountB + additionalAmountB)));
    //assert.ok(walletTokenAccount0BInfo.amount.eq(new anchor.BN(amount0B - initialAmountB - additionalAmountB)));

    let walletTokenAccountCInfo = await mintC.getAccountInfo(walletTokenAccountC);

    //assert.ok(walletTokenAccountCInfo.amount.eq(new anchor.BN(initialLiquidityMinted + additionalLiquidityMinted)));
  });

  const traderInputQuoteAccount = anchor.web3.Keypair.generate();
  const aToBAmount = 10 * (10 ** decimals0A);

  it('Get input price', async () => {
    const tx = await exchange.rpc.getBToAInputPrice(
      new anchor.BN(aToBAmount),
      {
        accounts: {
          authority: provider.wallet.publicKey,
          exchange: exchange0Account.publicKey,
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
          exchange: exchange0Account.publicKey,
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
  const exchange0Position0Account = anchor.web3.Keypair.generate();

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
          exchange: exchange0Account.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          pda,
          position: exchange0Position0Account.publicKey,
          recipient: walletTokenAccount0A,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          userA: walletTokenAccount0A,
          userB: walletTokenAccount0B
        },
        signers: [exchange0Position0Account]
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccount0AInfo = await mint0A.getAccountInfo(exchangeTokenAccount0A);
    let walletTokenAccount0AInfo = await mint0A.getAccountInfo(walletTokenAccount0A);

    //assert.ok(exchangeTokenAccount0AInfo.amount.eq(new anchor.BN(218)));
    //assert.ok(walletTokenAccount0AInfo.amount.eq(new anchor.BN(99782)));

    let exchangeTokenAccount0BInfo = await mint0B.getAccountInfo(exchangeTokenAccount0B);
    let walletTokenAccount0BInfo = await mint0B.getAccountInfo(walletTokenAccount0B);

    //assert.ok(exchangeTokenAccount0BInfo.amount.eq(new anchor.BN(131)));
    //assert.ok(walletTokenAccount0BInfo.amount.eq(new anchor.BN(99869)));

    let exchange0AccountInfo = await exchange.account.exchangeData.fetch(exchange0Account.publicKey)

    //assert.ok(exchange0AccountInfo.lastPrice.eq(new anchor.BN(6)));
  });

  const aToBAmountA = 3 * (decimals0A ** 10);
  const exchange0Position1Account = anchor.web3.Keypair.generate();

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
          exchange: exchange0Account.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          pda,
          position: exchange0Position1Account.publicKey,
          recipient: walletTokenAccount0A,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          userA: walletTokenAccount0A,
          userB: walletTokenAccount0B
        },
        signers: [exchange0Position1Account]
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccount0AInfo = await mint0A.getAccountInfo(exchangeTokenAccount0A);
    let walletTokenAccount0AInfo = await mint0A.getAccountInfo(walletTokenAccount0A);

    //assert.ok(exchangeTokenAccount0AInfo.amount.eq(new anchor.BN(206)));
    //assert.ok(walletTokenAccount0AInfo.amount.eq(new anchor.BN(99794)));

    let exchangeTokenAccount0BInfo = await mint0B.getAccountInfo(exchangeTokenAccount0B);
    let walletTokenAccount0BInfo = await mint0B.getAccountInfo(walletTokenAccount0B);

    //assert.ok(exchangeTokenAccount0BInfo.amount.eq(new anchor.BN(150)));
    //assert.ok(walletTokenAccount0BInfo.amount.eq(new anchor.BN(99850)));

    let exchange0AccountInfo = await exchange.account.exchangeData.fetch(exchange0Account.publicKey)

    //assert.ok(exchange0AccountInfo.lastPrice.eq(new anchor.BN(19)));
  });

  it('Initializes Pyth', async () => {
    await pyth.rpc.initialize({
      accounts: {
        authority: provider.wallet.publicKey,
        pyth: pythAccount.publicKey,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [pythAccount]
    });

    assert.ok(true);
  });

  //it('Get SOL Price', async() => {
  //  const pythProdKey = new anchor.web3.PublicKey('8yrQMUyJRnCJ72NWwMiPV9dNGw465Z8bKUvnUC8P5L6F');
  //  const pythSOLPriceProgKey = new anchor.web3.PublicKey('BdgHsXrH1mXqhdosXavYxZgX6bGqTdj5mh2sxDhF8bJy');
  //  await pyth.rpc.getPrice({
  //    accounts: {
  //      pyth: pythAccount.publicKey,
  //      pythProductInfo: pythProdKey,
  //      pythPriceInfo: pythSOLPriceProgKey
  //    }
  //  });

  //  const accountInfo = await provider.connection.getAccountInfo(pythAccount.publicKey);
  //  console.log('data = ', accountInfo.data);

  //  assert.ok(accountInfo.data);
  //});

  const removeAmountC = 87;

  it('Remove liquidity', async () => {
    const [pda, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode('exchange'))],
      exchange.programId
    );
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.removeLiquidity(
      new anchor.BN(removeAmountC),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchange0Account.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          mint: mintC.publicKey,
          pda,
          tokenProgram: TOKEN_PROGRAM_ID,
          userA: walletTokenAccount0A,
          userB: walletTokenAccount0B,
          userC: walletTokenAccountC
        }
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccount0AInfo = await mint0A.getAccountInfo(exchangeTokenAccount0A);
    let walletTokenAccount0AInfo = await mint0A.getAccountInfo(walletTokenAccount0A);

    //assert.ok(exchangeTokenAccount0AInfo.amount.eq(new anchor.BN(0)));
    //assert.ok(walletTokenAccount0AInfo.amount.eq(new anchor.BN(amount0A)));

    let exchangeTokenAccount0BInfo = await mint0B.getAccountInfo(exchangeTokenAccount0B);
    let walletTokenAccount0BInfo = await mint0B.getAccountInfo(walletTokenAccount0B);

    //assert.ok(exchangeTokenAccount0BInfo.amount.eq(new anchor.BN(0)));
    //assert.ok(walletTokenAccount0BInfo.amount.eq(new anchor.BN(amount0B)));

    let walletTokenAccountCInfo = await mintC.getAccountInfo(walletTokenAccountC);

    //assert.ok(walletTokenAccountCInfo.amount.eq(new anchor.BN(0)));
  });

  it('Add additional liquidity', async () => {
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.addLiquidity(
      new anchor.BN(additionalMaxAmountA),
      new anchor.BN(additionalAmountB),
      new anchor.BN(additionalMinLiquidityC),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchange0Account.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          mint: mintC.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          userA: walletTokenAccount0A,
          userB: walletTokenAccount0B,
          userC: walletTokenAccountC
        },
        signers: [provider.wallet.owner]
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccount0AInfo = await mint0A.getAccountInfo(exchangeTokenAccount0A);
    let walletTokenAccount0AInfo = await mint0A.getAccountInfo(walletTokenAccount0A);

    //assert.ok(exchangeTokenAccount0AInfo.amount.eq(new anchor.BN(additionalMaxAmountA)));
    //assert.ok(walletTokenAccount0AInfo.amount.eq(new anchor.BN(99850)));

    let exchangeTokenAccount0BInfo = await mint0B.getAccountInfo(exchangeTokenAccount0B);
    let walletTokenAccount0BInfo = await mint0B.getAccountInfo(walletTokenAccount0B);

    //assert.ok(exchangeTokenAccount0BInfo.amount.eq(new anchor.BN(75)));
    //assert.ok(walletTokenAccount0BInfo.amount.eq(new anchor.BN(99925)));

    let walletTokenAccountCInfo = await mintC.getAccountInfo(walletTokenAccountC);

    //assert.ok(walletTokenAccountCInfo.amount.eq(new anchor.BN(75)));
  });

  const bondMaxAmountV = 100 * (10 ** decimals0A);
  //const bondMaxAmountA = 100 * (10 ** decimals0A);
  //const bondAmountB = 50 * (10 ** decimals0B);
  //const bondMinLiquidityC = 0;
  //const bondLiquidityMinted = 50 * (10 ** decimalsC);

  it('Bond', async () => {
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.bondVToA(
      new anchor.BN(bondMaxAmountV),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchange0Account.publicKey,
          exchangeA: exchangeTokenAccount0A,
          exchangeB: exchangeTokenAccount0B,
          exchangeV: exchangeTokenAccount0V,
          mint: mintC.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          userA: walletTokenAccount0A,
          userB: walletTokenAccount0B,
          userC: walletTokenAccountC,
          userV: walletTokenAccount0V
        },
        signers: [provider.wallet.owner]
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccount0AInfo = await mint0A.getAccountInfo(exchangeTokenAccount0A);
    let walletTokenAccount0AInfo = await mint0A.getAccountInfo(walletTokenAccount0A);

    //assert.ok(exchangeTokenAccount0AInfo.amount.eq(new anchor.BN(additionalMaxAmountA)));
    //assert.ok(walletTokenAccount0AInfo.amount.eq(new anchor.BN(99850)));

    let exchangeTokenAccount0BInfo = await mint0B.getAccountInfo(exchangeTokenAccount0B);
    let walletTokenAccount0BInfo = await mint0B.getAccountInfo(walletTokenAccount0B);

    //assert.ok(exchangeTokenAccount0BInfo.amount.eq(new anchor.BN(75)));
    //assert.ok(walletTokenAccount0BInfo.amount.eq(new anchor.BN(99925)));

    let walletTokenAccountCInfo = await mintC.getAccountInfo(walletTokenAccountC);

    //assert.ok(walletTokenAccountCInfo.amount.eq(new anchor.BN(75)));
  });


  it('Second factory exchange created', async () => {
    const [pda, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode('exchange'))],
      exchange.programId
    );
    const fee = new anchor.BN(3);
    const tx = await factory.rpc.createExchange(
      mint1A.publicKey,
      mint1B.publicKey,
      mintC.publicKey,
      fee, {
        accounts: {
          exchange: exchange1Account.publicKey,
          exchangeA: exchangeTokenAccount1A,
          exchangeB: exchangeTokenAccount1B,
          exchangeProgram: exchange.programId,
          factory: factoryAccount.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID
        },
        instructions: [await exchange.account.exchangeData.createInstruction(exchange1Account)],
        signers: [factoryAccount.owner, exchange1Account]
      });

    console.log('Your transaction signature', tx);

    let exchangeTokenAccount0AInfo = await mint0A.getAccountInfo(exchangeTokenAccount0A);

    //assert.ok(exchangeTokenAccount0AInfo.amount.eq(new anchor.BN(0)));

    let exchangeTokenAccount0BInfo = await mint0B.getAccountInfo(exchangeTokenAccount0B);

    //assert.ok(exchangeTokenAccount0BInfo.amount.eq(new anchor.BN(0)));
    //assert.ok(exchangeTokenAccount0AInfo.owner.equals(pda));
    //assert.ok(exchangeTokenAccount0BInfo.owner.equals(pda));

    let factoryAccountInfo = await factory.account.factoryData.fetch(factoryAccount.publicKey)

    //assert.ok(factoryAccountInfo.tokenCount.eq(new anchor.BN(1)));
  });
});
