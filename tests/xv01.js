const anchor = require("@project-serum/anchor");
const { TOKEN_PROGRAM_ID, Token } = require("@solana/spl-token");
const TokenInstructions = require("@project-serum/serum").TokenInstructions;
const assert = require("assert");

const { SystemProgram } = anchor.web3;

describe("XV01", () => {
  anchor.setProvider(anchor.Provider.env());

  const factory = anchor.workspace.Factory;
  const exchange = anchor.workspace.Exchange;

  const provider = anchor.getProvider();

  let mintAuthority = provider.wallet;
  let mintA = null;
  let mintB = null;

  const amountA = 100000;
  const amountB = 100000;

  const traderAmountA = 500;
  const traderAmountB = 500;

  const amountLamports = 1000000000;  // 10,000,000 Lamports in 1 SOL

  const decimalsA = 18;
  const decimalsB = 18;
  const decimalsC = 18;

  const exchangeTemplate = anchor.web3.Keypair.generate();

  const payerAccount = anchor.web3.Keypair.generate();
  const factoryAccount = anchor.web3.Keypair.generate();
  const exchangeAccount = anchor.web3.Keypair.generate();
  const traderAccount = anchor.web3.Keypair.generate();

  let exchangeTokenAccountA = null;
  let exchangeTokenAccountB = null;

  let walletTokenAccountA = null;
  let walletTokenAccountB = null;
  let walletTokenAccountC = null;

  let traderTokenAccountA = null;
  let traderTokenAccountB = null;
  let traderTokenAccountC = null;

  it("State initialized", async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(payerAccount.publicKey, amountLamports),
      "confirmed"
    );

    mintA = await Token.createMint(
      provider.connection,
      payerAccount,
      mintAuthority.publicKey,
      null,
      decimalsA,
      TOKEN_PROGRAM_ID
    );

    mintB = await Token.createMint(
      provider.connection,
      payerAccount,
      mintAuthority.publicKey,
      null,
      decimalsB,
      TOKEN_PROGRAM_ID
    );

    mintC = await Token.createMint(
      provider.connection,
      payerAccount,
      mintAuthority.publicKey,
      null,
      decimalsC,
      TOKEN_PROGRAM_ID
    );

    walletTokenAccountA = await mintA.createAccount(provider.wallet.publicKey);
    walletTokenAccountB = await mintB.createAccount(provider.wallet.publicKey);
    walletTokenAccountC = await mintC.createAccount(provider.wallet.publicKey);

    exchangeTokenAccountA = await mintA.createAccount(exchangeAccount.publicKey);
    exchangeTokenAccountB = await mintB.createAccount(exchangeAccount.publicKey);

    traderTokenAccountA = await mintA.createAccount(traderAccount.publicKey);
    traderTokenAccountB = await mintB.createAccount(traderAccount.publicKey);

    await mintA.mintTo(
      walletTokenAccountA,
      mintAuthority.publicKey,
      [mintAuthority.payer],
      amountA
    );

    await mintB.mintTo(
      walletTokenAccountB,
      mintAuthority.publicKey,
      [mintAuthority.payer],
      amountB
    );

    await mintA.mintTo(
      traderTokenAccountA,
      mintAuthority.publicKey,
      [mintAuthority.payer],
      traderAmountA
    );

    await mintB.mintTo(
      traderTokenAccountB,
      mintAuthority.publicKey,
      [mintAuthority.payer],
      traderAmountB
    );

    let walletTokenAccountInfoA = await mintA.getAccountInfo(walletTokenAccountA);
    let walletTokenAccountInfoB = await mintB.getAccountInfo(walletTokenAccountB);

    assert.ok(walletTokenAccountInfoA.amount.toNumber() == amountA);
    assert.ok(walletTokenAccountInfoB.amount.toNumber() == amountB);

    let exchangeTokenAccountInfoA = await mintA.getAccountInfo(exchangeTokenAccountA);
    let exchangeTokenAccountInfoB = await mintB.getAccountInfo(exchangeTokenAccountB);

    assert.ok(exchangeTokenAccountInfoA.amount.toNumber() == 0);
    assert.ok(exchangeTokenAccountInfoB.amount.toNumber() == 0);

    let traderTokenAccountInfoA = await mintA.getAccountInfo(traderTokenAccountA);
    let traderTokenAccountInfoB = await mintB.getAccountInfo(traderTokenAccountB);

    assert.ok(traderTokenAccountInfoA.amount.toNumber() == traderAmountA);
    assert.ok(traderTokenAccountInfoB.amount.toNumber() == traderAmountB);
  });

  it("Factory initialized", async () => {
    const tx = await factory.rpc.initialize(exchangeTemplate.publicKey, {
      accounts: {
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        factory: factoryAccount.publicKey
      },
      signers: [factoryAccount]
    });

    console.log("Your transaction signature", tx);

    let factoryAccountInfo = await factory.account.factory.fetch(factoryAccount.publicKey)

    assert.ok(factoryAccountInfo.tokenCount.eq(new anchor.BN(0)));
    assert.ok(factoryAccountInfo.exchangeTemplate.toString() == exchangeTemplate.publicKey.toString());
  });

  it("Exchange created", async () => {
    let [pda, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [exchangeAccount.publicKey.toBuffer()],
      factory.programId
    );
    const fee = new anchor.BN(3);
    const tx = await factory.rpc.createExchange(
      mintA.publicKey,
      mintB.publicKey,
      mintC.publicKey,
      fee, {
        accounts: {
          authority: provider.wallet.publicKey,
          exchange: exchangeAccount.publicKey,
          factory: factoryAccount.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          exchangeProgram: exchange.programId,
          exchangeA: exchangeTokenAccountA,
          exchangeB: exchangeTokenAccountB
        },
        signers: [factoryAccount.owner, exchangeAccount],
        instructions: [await exchange.account.exchange.createInstruction(exchangeAccount)]
      });

    console.log("Your transaction signature", tx);

    let exchangeTokenAccountAInfo = await mintA.getAccountInfo(exchangeTokenAccountA);

    assert.ok(exchangeTokenAccountAInfo.amount.eq(new anchor.BN(0)));

    let exchangeTokenAccountBInfo = await mintB.getAccountInfo(exchangeTokenAccountB);

    assert.ok(exchangeTokenAccountBInfo.amount.eq(new anchor.BN(0)));
    console.log(exchangeTokenAccountAInfo.owner)
    console.log(pda);
    assert.ok(exchangeTokenAccountAInfo.owner.equals(pda));
    assert.ok(exchangeTokenAccountBInfo.owner.equals(pda));
  });

  const initialMaxAmountA = 100;
  const initialAmountB = 50;
  const initialMinLiquidityC = 0;
  const initialLiquidityMinted = 50;

  it("Add initial liquidity", async () => {
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.addLiquidity(
      new anchor.BN(initialMaxAmountA),
      new anchor.BN(initialAmountB),
      new anchor.BN(initialMinLiquidityC),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount.publicKey,
          mint: mintC.publicKey,
          userA: walletTokenAccountA,
          userB: walletTokenAccountB,
          userC: walletTokenAccountC,
          exchangeA: exchangeTokenAccountA,
          exchangeB: exchangeTokenAccountB
        },
        signers: [provider.wallet.owner]
      });

    console.log("Your transaction signature", tx);

    let exchangeTokenAccountAInfo = await mintA.getAccountInfo(exchangeTokenAccountA);
    let walletTokenAccountAInfo = await mintA.getAccountInfo(walletTokenAccountA);

    assert.ok(exchangeTokenAccountAInfo.amount.eq(new anchor.BN(initialMaxAmountA)));
    assert.ok(walletTokenAccountAInfo.amount.eq(new anchor.BN(amountA - initialMaxAmountA)));

    let exchangeTokenAccountBInfo = await mintB.getAccountInfo(exchangeTokenAccountB);
    let walletTokenAccountBInfo = await mintB.getAccountInfo(walletTokenAccountB);

    assert.ok(exchangeTokenAccountBInfo.amount.eq(new anchor.BN(initialAmountB)));
    assert.ok(walletTokenAccountBInfo.amount.eq(new anchor.BN(amountB - initialAmountB)));

    let walletTokenAccountCInfo = await mintC.getAccountInfo(walletTokenAccountC);

    assert.ok(walletTokenAccountCInfo.amount.eq(new anchor.BN(initialLiquidityMinted)));
  });

  const additionalMaxAmountA = 150;
  const additionalAmountB = 75;
  const additionalMinLiquidityC = 5;
  const additionalLiquidityMinted = 25;

  it("Add additional liquidity", async () => {
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.addLiquidity(
      new anchor.BN(additionalMaxAmountA),
      new anchor.BN(additionalAmountB),
      new anchor.BN(additionalMinLiquidityC),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          exchange: exchangeAccount.publicKey,
          mint: mintC.publicKey,
          userA: walletTokenAccountA,
          userB: walletTokenAccountB,
          userC: walletTokenAccountC,
          exchangeA: exchangeTokenAccountA,
          exchangeB: exchangeTokenAccountB
        },
        signers: [provider.wallet.owner]
      });

    console.log("Your transaction signature", tx);

    let exchangeTokenAccountAInfo = await mintA.getAccountInfo(exchangeTokenAccountA);
    let walletTokenAccountAInfo = await mintA.getAccountInfo(walletTokenAccountA);

    assert.ok(exchangeTokenAccountAInfo.amount.eq(new anchor.BN(250)));
    assert.ok(walletTokenAccountAInfo.amount.eq(new anchor.BN(99750)));

    let exchangeTokenAccountBInfo = await mintB.getAccountInfo(exchangeTokenAccountB);
    let walletTokenAccountBInfo = await mintB.getAccountInfo(walletTokenAccountB);

    assert.ok(exchangeTokenAccountBInfo.amount.eq(new anchor.BN(125)));
    assert.ok(walletTokenAccountBInfo.amount.eq(new anchor.BN(99875)));

    let walletTokenAccountCInfo = await mintC.getAccountInfo(walletTokenAccountC);

    assert.ok(walletTokenAccountCInfo.amount.eq(new anchor.BN(87)));
  });

  const traderInputQuoteAccount = anchor.web3.Keypair.generate();
  const aToBAmount = 10;

  it("Get input price", async () => {
    const tx = await exchange.rpc.getBToAInputPrice(
      new anchor.BN(aToBAmount),
      {
        accounts: {
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          exchange: exchangeAccount.publicKey,
          quote: traderInputQuoteAccount.publicKey,
          exchangeA: exchangeTokenAccountA,
          exchangeB: exchangeTokenAccountB,
        },
        signers: [traderInputQuoteAccount]
      });

    console.log("Your transaction signature", tx);

    let traderInputAccountQuoteInfo = await exchange.account.quote.fetch(traderInputQuoteAccount.publicKey);

    assert.ok(traderInputAccountQuoteInfo.price.eq(new anchor.BN(48)));
  });

  const traderOutputQuoteAccount = anchor.web3.Keypair.generate();
  const bToAAmount = 5;

  it("Get output price", async () => {
    const tx = await exchange.rpc.getBToAOutputPrice(
      new anchor.BN(bToAAmount),
      {
        accounts: {
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          exchange: exchangeAccount.publicKey,
          quote: traderOutputQuoteAccount.publicKey,
          exchangeA: exchangeTokenAccountA,
          exchangeB: exchangeTokenAccountB,
        },
        signers: [traderOutputQuoteAccount]
      });

    console.log("Your transaction signature", tx);

    let traderOutputQuoteAccountInfo = await exchange.account.quote.fetch(traderOutputQuoteAccount.publicKey);

    assert.ok(traderOutputQuoteAccountInfo.price.eq(new anchor.BN(4)));
  });

  const bToAAmountB = 6;

  it("B to A input", async () => {
    const [pda, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("exchange"))],
      exchange.programId
    );
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.bToAInput(
      new anchor.BN(bToAAmountB),
      deadline,
      {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          exchange: exchangeAccount.publicKey,
          pda: pda,
          userA: walletTokenAccountA,
          userB: walletTokenAccountB,
          exchangeA: exchangeTokenAccountA,
          exchangeB: exchangeTokenAccountB,
          recipient: walletTokenAccountA
        }
      });

    console.log("Your transaction signature", tx);

    let exchangeTokenAccountAInfo = await mintA.getAccountInfo(exchangeTokenAccountA);
    let walletTokenAccountAInfo = await mintA.getAccountInfo(walletTokenAccountA);

    assert.ok(exchangeTokenAccountAInfo.amount.eq(new anchor.BN(218)));
    assert.ok(walletTokenAccountAInfo.amount.eq(new anchor.BN(99782)));

    let exchangeTokenAccountBInfo = await mintB.getAccountInfo(exchangeTokenAccountB);
    let walletTokenAccountBInfo = await mintB.getAccountInfo(walletTokenAccountB);

    assert.ok(exchangeTokenAccountBInfo.amount.eq(new anchor.BN(131)));
    assert.ok(walletTokenAccountBInfo.amount.eq(new anchor.BN(99869)));
  });

  const aToBAmountA = 12;

  it("A to B input", async () => {
    const [pda, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("exchange"))],
      exchange.programId
    );
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.aToBInput(
      new anchor.BN(aToBAmountA),
      deadline,
      {
        accounts: {
          authority: provider.wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          exchange: exchangeAccount.publicKey,
          pda,
          userA: walletTokenAccountA,
          userB: walletTokenAccountB,
          exchangeA: exchangeTokenAccountA,
          exchangeB: exchangeTokenAccountB,
          recipient: walletTokenAccountA
        }
      });

    console.log("Your transaction signature", tx);

    let exchangeTokenAccountAInfo = await mintA.getAccountInfo(exchangeTokenAccountA);
    let walletTokenAccountAInfo = await mintA.getAccountInfo(walletTokenAccountA);

    assert.ok(exchangeTokenAccountAInfo.amount.eq(new anchor.BN(206)));
    assert.ok(walletTokenAccountAInfo.amount.eq(new anchor.BN(99794)));

    let exchangeTokenAccountBInfo = await mintB.getAccountInfo(exchangeTokenAccountB);
    let walletTokenAccountBInfo = await mintB.getAccountInfo(walletTokenAccountB);

    assert.ok(exchangeTokenAccountBInfo.amount.eq(new anchor.BN(150)));
    assert.ok(walletTokenAccountBInfo.amount.eq(new anchor.BN(99850)));
  });

  const removeAmountC = 87;

  it("Remove liquidity", async () => {
    const [pda, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("exchange"))],
      exchange.programId
    );
    const deadline = new anchor.BN(Date.now() / 1000);
    const tx = await exchange.rpc.removeLiquidity(
      new anchor.BN(removeAmountC),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          mint: mintC.publicKey,
          pda,
          exchange: exchangeAccount.publicKey,
          exchangeA: exchangeTokenAccountA,
          exchangeB: exchangeTokenAccountB,
          userA: walletTokenAccountA,
          userB: walletTokenAccountB,
          userC: walletTokenAccountC
        }
      });

    console.log("Your transaction signature", tx);

    let exchangeTokenAccountAInfo = await mintA.getAccountInfo(exchangeTokenAccountA);
    let walletTokenAccountAInfo = await mintA.getAccountInfo(walletTokenAccountA);

    assert.ok(exchangeTokenAccountAInfo.amount.eq(new anchor.BN(0)));
    assert.ok(walletTokenAccountAInfo.amount.eq(new anchor.BN(amountA)));

    let exchangeTokenAccountBInfo = await mintB.getAccountInfo(exchangeTokenAccountB);
    let walletTokenAccountBInfo = await mintB.getAccountInfo(walletTokenAccountB);

    assert.ok(exchangeTokenAccountBInfo.amount.eq(new anchor.BN(0)));
    assert.ok(walletTokenAccountBInfo.amount.eq(new anchor.BN(amountB)));

    let walletTokenAccountCInfo = await mintC.getAccountInfo(walletTokenAccountC);

    assert.ok(walletTokenAccountCInfo.amount.eq(new anchor.BN(0)));
  });
});
