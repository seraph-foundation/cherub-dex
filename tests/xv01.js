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
  let mintA = null;
  let mintB = null;

  const amountA = 1000;
  const amountB = 500;

  const factoryAccount = anchor.web3.Keypair.generate();
  const exchangeAccount = anchor.web3.Keypair.generate();

  const exchangeTemplate = anchor.web3.Keypair.generate();

  let exchangeTokenAccountA = null;
  let exchangeTokenAccountB = null;

  let walletTokenAccountA = null;
  let walletTokenAccountB = null;

  it("State initialized", async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(payer.publicKey, 10000000000),
      "confirmed"
    );

    mintA = await Token.createMint(
      provider.connection,
      payer,
      mintAuthority.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID
    );

    mintB = await Token.createMint(
      provider.connection,
      payer,
      mintAuthority.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID
    );

    walletTokenAccountA = await mintA.createAccount(provider.wallet.publicKey);
    walletTokenAccountB = await mintB.createAccount(provider.wallet.publicKey);

    exchangeTokenAccountA = await mintA.createAccount(exchangeAccount.publicKey);
    exchangeTokenAccountB = await mintB.createAccount(exchangeAccount.publicKey);

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

    walletTokenAccountInfoA = await mintA.getAccountInfo(walletTokenAccountA);
    walletTokenAccountInfoB = await mintB.getAccountInfo(walletTokenAccountB);

    exchangeTokenAccountInfoA = await mintA.getAccountInfo(exchangeTokenAccountA);
    exchangeTokenAccountInfoB = await mintB.getAccountInfo(exchangeTokenAccountB);

    assert.ok(walletTokenAccountInfoA.amount.toNumber() == amountA);
    assert.ok(walletTokenAccountInfoB.amount.toNumber() == amountB);

    assert.ok(exchangeTokenAccountInfoA.amount.toNumber() == 0);
    assert.ok(exchangeTokenAccountInfoB.amount.toNumber() == 0);
  });

  it("Factory initialized", async () => {
    const tx = await factory.rpc.initialize(exchangeTemplate.publicKey, {
      accounts: {
        factory: factoryAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId
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
        exchange: exchangeAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId
      },
      signers: [exchangeAccount]
    });

    console.log("Your transaction signature", tx);

    let exchangeAccountInfo = await exchange.account.exchange.fetch(exchangeAccount.publicKey)
    assert.ok(exchangeAccountInfo.factory.toString() == factoryAccount.publicKey.toString());
  });

  it("Exchange created", async () => {
    const tokenName = stringToU64("XV01");
    const tokenSymbol = stringToU64("XV01");
    const tx = await factory.rpc.createExchange(mintA.publicKey, tokenName, tokenSymbol, {
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
    u64ToString(exchangeAccountInfo.name);
    assert.ok(exchangeAccountInfo.totalSupply.eq(new anchor.BN(0)));
    assert.ok(exchangeAccountInfo.decimals.eq(new anchor.BN(18)));
  });

  it("Add liquidity", async () => {
    const amount = new anchor.BN(1);
    const tx = await exchange.rpc.addLiquidity(amount, {
      accounts: {
        authority: provider.wallet.publicKey,
        from: walletTokenAccountA,
        to: exchangeTokenAccountA,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });

    console.log("Your transaction signature", tx);

    let exchangeTokenAccountAInfo = await mintA.getAccountInfo(exchangeTokenAccountA);
    let walletTokenAccountAInfo = await mintA.getAccountInfo(walletTokenAccountA);

    assert.ok(exchangeTokenAccountAInfo.amount.eq(new anchor.BN(amount)));
    assert.ok(walletTokenAccountAInfo.amount.eq(new anchor.BN(amountA - amount)));
  });

  it("Remove liquidity", async () => {
    const amount = new anchor.BN(1);
    const tx = await exchange.rpc.removeLiquidity(amount, {
      accounts: {
        authority: exchangeAccount.publicKey,
        from: exchangeTokenAccountA,
        to: walletTokenAccountA,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [exchangeAccount]
    });

    console.log("Your transaction signature", tx);

    let exchangeTokenAccountAInfo = await mintA.getAccountInfo(exchangeTokenAccountA);
    let walletTokenAccountAInfo = await mintA.getAccountInfo(walletTokenAccountA);

    assert.ok(exchangeTokenAccountAInfo.amount.eq(new anchor.BN(0)));
    assert.ok(walletTokenAccountAInfo.amount.eq(new anchor.BN(amountA)));
  });
});

function u64ToString(bn) {
  // TODO: Finish this
  var array = bn.toBuffer();
  var result = "";
  for (var i = 0; i < array.length; i++) {
    result += String.fromCharCode(parseInt(array[i], 2));
  }
  return result;
}

function stringToU64(str) {
  var result = [];
  for (var i = 0; i < str.length; i++) {
    result.push(str.charCodeAt(i).toString(2));
  }
  var bn = new anchor.BN(result);
  return bn
}
