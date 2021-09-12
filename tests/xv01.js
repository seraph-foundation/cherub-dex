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

  const payer = anchor.web3.Keypair.generate();

  let mintAuthority = provider.wallet;
  let mintX = null;
  let mintY = null;

  const amountX = 1000;
  const amountY = 500;
  const amountZ = 1;

  const amountLamports = 10000000000;  // How many lamports per SOL?

  const decimalsX = 18;
  const decimalsY = 18;
  const decimalsZ = 18;

  const factoryAccount = anchor.web3.Keypair.generate();
  const exchangeAccount = anchor.web3.Keypair.generate();

  const exchangeTemplate = anchor.web3.Keypair.generate();

  let exchangeTokenAccountX = null;
  let exchangeTokenAccountY = null;
  let exchangeTokenAccountZ = null;

  let walletTokenAccountX = null;
  let walletTokenAccountY = null;
  let walletTokenAccountZ = null;

  it("State initialized", async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(payer.publicKey, amountLamports),
      "confirmed"
    );

    mintX = await Token.createMint(
      provider.connection,
      payer,
      mintAuthority.publicKey,
      null,
      decimalsX,
      TOKEN_PROGRAM_ID
    );

    mintY = await Token.createMint(
      provider.connection,
      payer,
      mintAuthority.publicKey,
      null,
      decimalsY,
      TOKEN_PROGRAM_ID
    );

    mintZ = await Token.createMint(
      provider.connection,
      payer,
      mintAuthority.publicKey,
      null,
      decimalsZ,
      TOKEN_PROGRAM_ID
    );

    walletTokenAccountX = await mintX.createAccount(provider.wallet.publicKey);
    walletTokenAccountY = await mintY.createAccount(provider.wallet.publicKey);
    walletTokenAccountZ = await mintZ.createAccount(provider.wallet.publicKey);

    exchangeTokenAccountX = await mintX.createAccount(exchangeAccount.publicKey);
    exchangeTokenAccountY = await mintY.createAccount(exchangeAccount.publicKey);
    exchangeTokenAccountZ = await mintZ.createAccount(exchangeAccount.publicKey);

    await mintX.mintTo(
      walletTokenAccountX,
      mintAuthority.publicKey,
      [mintAuthority.payer],
      amountX
    );

    await mintY.mintTo(
      walletTokenAccountY,
      mintAuthority.publicKey,
      [mintAuthority.payer],
      amountY
    );

    await mintZ.mintTo(
      walletTokenAccountZ,
      mintAuthority.publicKey,
      [mintAuthority.payer],
      amountZ
    );

    walletTokenAccountInfoX = await mintX.getAccountInfo(walletTokenAccountX);
    walletTokenAccountInfoY = await mintY.getAccountInfo(walletTokenAccountY);
    walletTokenAccountInfoZ = await mintZ.getAccountInfo(walletTokenAccountZ);

    exchangeTokenAccountInfoX = await mintX.getAccountInfo(exchangeTokenAccountX);
    exchangeTokenAccountInfoY = await mintY.getAccountInfo(exchangeTokenAccountY);
    exchangeTokenAccountInfoZ = await mintZ.getAccountInfo(exchangeTokenAccountZ);

    assert.ok(walletTokenAccountInfoX.amount.toNumber() == amountX);
    assert.ok(walletTokenAccountInfoY.amount.toNumber() == amountY);
    assert.ok(walletTokenAccountInfoZ.amount.toNumber() == amountZ);

    assert.ok(exchangeTokenAccountInfoX.amount.toNumber() == 0);
    assert.ok(exchangeTokenAccountInfoY.amount.toNumber() == 0);
    assert.ok(exchangeTokenAccountInfoZ.amount.toNumber() == 0);

    //assert.ok(exchangeAccountInfo.decimalsX.eq(new anchor.BN(18)));
    //assert.ok(exchangeAccountInfo.decimalsY.eq(new anchor.BN(18)));
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

  it("Exchange initialized", async () => {
    const tx = await exchange.rpc.initialize(factoryAccount.publicKey, {
      accounts: {
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        exchange: exchangeAccount.publicKey
      },
      signers: [exchangeAccount]
    });

    console.log("Your transaction signature", tx);

    let exchangeAccountInfo = await exchange.account.exchange.fetch(exchangeAccount.publicKey)
    assert.ok(exchangeAccountInfo.factory.toString() == factoryAccount.publicKey.toString());
  });

  it("Exchange created", async () => {
    const tx = await factory.rpc.createExchange(
      mintX.publicKey, mintY.publicKey, {
        accounts: {
          factory: factoryAccount.publicKey,
          exchange: exchangeAccount.publicKey,
          exchangeProgram: exchange.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [factoryAccount.owner],
      });

    console.log("Your transaction signature", tx);

    let exchangeAccountInfo = await exchange.account.exchange.fetch(exchangeAccount.publicKey);
    assert.ok(exchangeAccountInfo.totalSupplyX.eq(new anchor.BN(0)));
    assert.ok(exchangeAccountInfo.totalSupplyY.eq(new anchor.BN(0)));
  });

  it("Add liquidity", async () => {
    const deadline = new anchor.BN(Date.now() / 1000);

    const minLiquidityX = 0;
    const minLiquidityY = 0;

    const maxTokensX = 2;
    const maxTokensY = 3;

    const tx = await exchange.rpc.addLiquidity(
      new anchor.BN(maxTokensX),
      new anchor.BN(minLiquidityX),
      new anchor.BN(maxTokensY),
      new anchor.BN(minLiquidityY),
      deadline, {
        accounts: {
          authority: provider.wallet.publicKey,
          exchange: exchangeAccount.publicKey,
          fromX: walletTokenAccountX,
          fromY: walletTokenAccountY,
          fromZ: walletTokenAccountZ,
          toX: exchangeTokenAccountX,
          toY: exchangeTokenAccountY,
          toZ: exchangeTokenAccountZ,
          tokenProgram: TOKEN_PROGRAM_ID,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY
        },
      });

    console.log("Your transaction signature", tx);

    let exchangeTokenAccountXInfo = await mintX.getAccountInfo(exchangeTokenAccountX);
    let walletTokenAccountXInfo = await mintX.getAccountInfo(walletTokenAccountX);

    let exchangeTokenAccountYInfo = await mintY.getAccountInfo(exchangeTokenAccountY);
    let walletTokenAccountYInfo = await mintY.getAccountInfo(walletTokenAccountY);

    let exchangeTokenAccountZInfo = await mintZ.getAccountInfo(exchangeTokenAccountZ);
    let walletTokenAccountZInfo = await mintZ.getAccountInfo(walletTokenAccountZ);

    assert.ok(exchangeTokenAccountXInfo.amount.eq(new anchor.BN(maxTokensX)));
    assert.ok(walletTokenAccountXInfo.amount.eq(new anchor.BN(amountX - maxTokensX)));
  });

  //it("Remove liquidity", async () => {
  //  const amount = new anchor.BN(1);
  //  const tx = await exchange.rpc.removeLiquidity(amount, {
  //    accounts: {
  //      authority: exchangeAccount.publicKey,
  //      exchange: exchangeAccount.publicKey,
  //      from: exchangeTokenAccountX,
  //      to: walletTokenAccountX,
  //      tokenProgram: TOKEN_PROGRAM_ID,
  //    },
  //    signers: [exchangeAccount]
  //  });

  //  console.log("Your transaction signature", tx);

  //  let exchangeTokenAccountAInfo = await mintX.getAccountInfo(exchangeTokenAccountA);
  //  let walletTokenAccountAInfo = await mintX.getAccountInfo(walletTokenAccountA);

  //  assert.ok(exchangeTokenAccountAInfo.amount.eq(new anchor.BN(0)));
  //  assert.ok(walletTokenAccountAInfo.amount.eq(new anchor.BN(amountA)));
  //});
});
