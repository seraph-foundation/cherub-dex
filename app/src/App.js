import 'antd/dist/antd.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css';

import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';
import {
  Alert, Button, Card, Col, Dropdown, Input, Layout, List, Modal, Menu, Radio, Row, Select, Slider, Steps, Table, Typography, notification
} from 'antd';
import { BN, Program, Provider, utils } from '@project-serum/anchor';
import {
  BankOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, DollarOutlined, DownOutlined, HistoryOutlined, PieChartOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SYSVAR_CLOCK_PUBKEY, SystemProgram, clusterApiUrl } from '@solana/web3.js';
import { ConnectionProvider, WalletProvider, useWallet  } from '@solana/wallet-adapter-react';
import { Line } from 'react-chartjs-2';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { getPhantomWallet, getSlopeWallet, getSolletWallet } from '@solana/wallet-adapter-wallets';
import { parsePriceData } from '@pythnetwork/client';
import { useEffect, useCallback, useState } from 'react';

import exchangeIdl from './exchange.json';
import factoryIdl from './factory.json';
import pythIdl from './pyth.json';

const { Content, Footer, Header } = Layout;
const { Option } = Select;
const { Step } = Steps;
const { Title } = Typography;

const LOCALHOST = 'http://localhost:3000';
const LOCALNET = 'http://127.0.0.1:8899';

const IS_LOCALHOST = window.location.origin === LOCALHOST;

let accounts = {};

if (IS_LOCALHOST) {
  accounts = require('./accounts-localnet.json');
} else {
  accounts = require('./accounts-devnet.json');
}

const CHERUB = accounts.exchanges.find((x) => x.symbol === 'CHRB');
const SOL = accounts.exchanges.find((x) => x.symbol === 'SOL');
const githubUrl = 'https://www.github.com/cherub-so/cherub-protocol';
const logoText = 'cheruβ';
const network = IS_LOCALHOST ? LOCALNET : clusterApiUrl('devnet');
const opts = { preflightCommitment: 'processed' };
const wallets = [getPhantomWallet(), getSolletWallet(), getSlopeWallet()];

const DEFAULT_SYMBOL = getWindowRoute() === 'stake' ? CHERUB.symbol : SOL.symbol;

const Direction = {
  Long: { long: {} },
  Short: { short: {} }
};

const chartOptions = {
  scales: {
    x: {
      display: true,
      grid: { display: false }
    },
    y: {
      display: true,
      grid: { display: false }
    }
  },
  plugins: {
    legend: { display: false }
  }
}

const inversePositionsColumns = [{
  title: 'Quantity',
  dataIndex: 'quantity',
  key: 'quantity'
}, {
  title: 'Entry',
  dataIndex: 'entry',
  key: 'entry'
}, {
  title: 'Equity',
  dataIndex: 'equity',
  key: 'equity'
}, {
  title: 'Direction',
  dataIndex: 'direction',
  key: 'direction'
}, {
  title: 'Status',
  dataIndex: 'status',
  key: 'status'
}];

const daoProposals = [{
  description: '4 • September 25th, 2021',
  icon: <ClockCircleOutlined className='ClockCircleOutlined'/>,
  title: 'Move SOL/COPE stake to SOL/MANGO'
}, {
  description: '3 • Executed September 12th, 2021',
  icon: <CheckCircleOutlined className='CheckCircleOutlined'/>,
  title: 'Contributor Grant: Tim Su'
}, {
  description: '2 • Executed September 2nd, 2021',
  icon: <CloseCircleOutlined className='CloseCircleOutlined'/>,
  title: 'Add AAVE, SUSHI, YFI'
}, {
  description: '1 • Executed September 1st, 2021',
  icon: <CheckCircleOutlined className='CheckCircleOutlined'/>,
  title: 'Set Pause Guardian to Community Multi-Sig'
}];

const treasuryData = {
  datasets: [{
    backgroundColor: '#69c0ff',
    borderColor: '#40a9ff',
    data: [0, 7, 6, 10, 24, 51, 54, 176],
    fill: true
  }],
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
};

const tvdData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [{
    backgroundColor: '#69c0ff',
    borderColor: '#40a9ff',
    data: [0, 5, 10, 33, 35, 51, 54, 76],
    fill: true
  }]
};

function currencyFormat(x) {
  return '$' + x.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

function getWindowRoute() {
  const routes = ['dao', 'inverse', 'stake', 'bond'];
  if (window.location.href.split('#/').length === 2 && routes.indexOf(window.location.href.split('#/')[1]) >= 0) {
    return window.location.href.split('#/')[1];
  } else {
    // First route is default route
    return routes[0];
  }
}

function App() {
  const [balance, setBalance] = useState(0);
  const [blockHeight, setBlockHeight] = useState(0);
  const [bondCard, setBondCard] = useState('bond');
  const [bondDeposit, setBondDeposit] = useState();
  const [cCirculatingSupplyTotal, setCCirculatingSupplyTotal] = useState('0 / 0');
  const [cCurrentPrice, setCCurrentPrice] = useState(0);
  const [cMarketCap, setCMarketCap] = useState(0);
  const [change24H, setChange24H] = useState();
  const [countdown, setCountdown] = useState('');
  const [currentExchange, setCurrentExchange] = useState({ account: null, accountV: null, tokenV: null, symbol: null });
  const [currentMarketPrice, setCurrentMarketPrice] = useState();
  const [daoCard, setDAOCard] = useState('statistics');
  const [exchangeRate, setExchangeRate] = useState(0);
  const [fundingRate, setFundingRate] = useState();
  // eslint-disable-next-line
  const [gasFee, setGasFee] = useState();
  const [high24H, setHigh24H] = useState();
  const [isBlockHeightIntervalSet, setIsBlockHeightIntervalSet] = useState(false);
  const [isCountdownIntervalSet, setIsCountdownIntervalSet] = useState(false);
  const [isInverseAssetModalVisible, setIsInverseAssetModalVisible] = useState(false);
  const [isInverseDataSet, setIsInverseDataSet] = useState(false);
  const [indexPrice, setIndexPrice] = useState();
  const [inverseAsset, setInverseAsset] = useState(DEFAULT_SYMBOL);
  const [inverseCard, setInverseCard] = useState('inverse');
  const [inverseDirection, setInverseDirection] = useState('long');
  const [inverseQuantity, setInverseQuantity] = useState();
  const [inversePositionAccount, setInversePositionAccount] = useState();
  const [inversePositions, setInversePositions] = useState([]);
  const [inverseStep, setInverseStep] = useState(0);
  const [leverage, setLeverage] = useState(1);
  const [low24H, setLow24H] = useState();
  const [menu, setMenu] = useState('');
  const [stakeCard, setStakeCard] = useState('stake');
  const [stakeDeposit, setStakeDeposit] = useState();
  const [stakeStep, setStakeStep] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);
  const [turnaround24H, setTurnaround24H] = useState();

  const wallet = useWallet();

  const getProviderCallback = useCallback(getProvider, [getProvider]);

  const getBalanceCallback = useCallback(getBalance, [getProviderCallback, currentExchange.tokenV, wallet.publicKey]);
  const getBlockHeightCallback = useCallback(getBlockHeight, [getProviderCallback]);
  const getDashboardDataCallback = useCallback(getDashboardData, [getProviderCallback]);
  const getInverseDataCallback = useCallback(getInverseData, [getProviderCallback]);
  const getPositionsCallback = useCallback(getPositions, [currentExchange.tokenA, getProviderCallback, inversePositionAccount, inversePositions]);

  async function getProvider() {
    const connection = new Connection(network, opts.preflightCommitment);
    return new Provider(connection, wallet, opts.preflightCommitment);
  }

  function getBlockHeight() {
    getProviderCallback().then((provider) => {
      provider.connection.getEpochInfo().then(function(epochInfo) {
        setBlockHeight(epochInfo.blockHeight);
      });
    });
  }

  async function getPositions() {
    try {
      if (inversePositionAccount) {
        const provider = await getProviderCallback();

        const exchange = new Program(exchangeIdl, new PublicKey(exchangeIdl.metadata.address), provider);
        const tokenA = new Token(provider.connection, new PublicKey(currentExchange.tokenA), TOKEN_PROGRAM_ID, null);

        const mintInfoA = await tokenA.getMintInfo();
        const positionAccount = await exchange.account.positionData.fetch(new PublicKey(inversePositionAccount.publicKey));

        // TODO: There should only be one position per exchange per wallet
        setInversePositions([{
          key: (inversePositions.length + 1).toString(),
          quantity: (positionAccount.quantity.toNumber() / (10 ** mintInfoA.decimals)).toFixed(2),
          entry: (positionAccount.entry.toNumber() / (10 ** mintInfoA.decimals)).toFixed(2),
          equity: (positionAccount.equity.toNumber() / (10 ** mintInfoA.decimals)).toFixed(2),
          direction: positionAccount.direction.long ? 'Long' : 'Short',
          status: positionAccount.status.open ? 'Open' : (positionAccount.status.closed ? 'Closed' : 'Liquidated')
        }]);
      }
    } catch(e) {
      console.log(e);
    }
  }

  async function getBalance() {
    try {
      const provider = await getProviderCallback();
      if (currentExchange.tokenV === SOL.tokenV) {
        const balance = await provider.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      } else {
        const tokenV = new Token(provider.connection, new PublicKey(currentExchange.tokenV), TOKEN_PROGRAM_ID);
        const walletTokenAccountV = await Token.getAssociatedTokenAddress(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          tokenV.publicKey,
          provider.wallet.publicKey
        );
        const accountInfoV = await tokenV.getAccountInfo(walletTokenAccountV);
        const mintInfoV = await tokenV.getMintInfo();
        setBalance((accountInfoV.amount.toNumber() / (10 ** mintInfoV.decimals)).toFixed(2));
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function getDashboardData() {
    try {
      const provider = await getProviderCallback();
      const exchange = new Program(exchangeIdl, new PublicKey(exchangeIdl.metadata.address), provider);
      const factory = new Program(factoryIdl, new PublicKey(factoryIdl.metadata.address), provider);

      const tokenC = new Token(provider.connection, new PublicKey(accounts.factory.tokenC), TOKEN_PROGRAM_ID);
      const tokenS = new Token(provider.connection, new PublicKey(accounts.factory.tokenS), TOKEN_PROGRAM_ID);
      const mintInfoC = await tokenC.getMintInfo();
      const mintInfoS = await tokenS.getMintInfo();

      const supply = mintInfoS.supply.toNumber() / (10 ** mintInfoS.decimals);
      const total = mintInfoC.supply.toNumber() / (10 ** mintInfoC.decimals);
      setCCirculatingSupplyTotal(supply.toFixed(0) + ' / ' + total.toFixed(0));

      const exchangeDataAccount = await exchange.account.exchangeData.fetch(new PublicKey(CHERUB.account));
      const lastPrice = (exchangeDataAccount.lastPrice.toNumber() / (10 ** mintInfoC.decimals)).toFixed(2);
      setCCurrentPrice(currencyFormat(lastPrice / 1));
      setCMarketCap(currencyFormat(lastPrice * total));

      const account = await factory.account.factoryData.fetch(new PublicKey(accounts.factory.account));
      setTokenCount(account.tokenCount.toNumber());
    } catch (err) {
      console.log(err);
    }
  }

  function setDummyInverseData(lastPrice, indexPrice) {
    setChange24H('+' + (lastPrice > 0 ? (Math.random() / 100 + 2).toFixed(2) : 0));
    setFundingRate(lastPrice > 0 ? ((lastPrice - indexPrice) / 1000).toFixed(4) : 0);
    setHigh24H((lastPrice * (Math.random() / 100 + 1.1)).toFixed(2));
    setLow24H((lastPrice * (Math.random() / 100 + 0.9)).toFixed(2));
    setTurnaround24H((lastPrice * (Math.random() * 10000 + 1.3)).toFixed(0));
  }

  async function getInverseData(asset) {
    try {
      const currentExchange = accounts.exchanges.find((x) => x.symbol === asset);

      const provider = await getProviderCallback();
      const exchangePublicKey = new PublicKey(accounts.exchanges.find((x) => x.symbol === asset).account);
      const exchange = new Program(exchangeIdl, new PublicKey(exchangeIdl.metadata.address), provider);

      const exchangeAccount = await exchange.account.exchangeData.fetch(exchangePublicKey);
      const mintAPublicKey = accounts.exchanges.find((x) => x.symbol === asset).tokenA;
      const tokenA = new Token(provider.connection, new PublicKey(mintAPublicKey), TOKEN_PROGRAM_ID, null);
      const mintAInfo = await tokenA.getMintInfo();
      const lastPrice = (exchangeAccount.lastPrice.toNumber() / (10 ** mintAInfo.decimals)).toFixed(2);

      const pyth = new Program(pythIdl, new PublicKey(pythIdl.metadata.address), provider);
      const pythFeedAccountInfo = await pyth.provider.connection.getAccountInfo(new PublicKey(currentExchange.oracle));
      const indexPrice = parsePriceData(pythFeedAccountInfo.data).price;

      setCurrentMarketPrice(lastPrice);
      setIndexPrice(indexPrice.toFixed(2));
      setExchangeRate(lastPrice);
      setDummyInverseData(lastPrice, indexPrice);
    } catch (err) {
      console.log(err);
    }

    setInverseStep(0);
    setInverseQuantity();
  }

  async function approveInverse() {
    let message;
    let description;

    try {
      const provider = await getProviderCallback();
      const exchange = new Program(exchangeIdl, new PublicKey(exchangeIdl.metadata.address), provider);
      const exchangePublicKey = new PublicKey(currentExchange.account);

      const tokenA = new Token(provider.connection, new PublicKey(currentExchange.tokenA), TOKEN_PROGRAM_ID);
      const tokenB = new Token(provider.connection, new PublicKey(currentExchange.tokenB), TOKEN_PROGRAM_ID);
      const mintAInfo = await tokenA.getMintInfo();

      const walletTokenAccountA = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenA.publicKey,
        provider.wallet.publicKey
      );
      const walletTokenAccountB = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenB.publicKey,
        provider.wallet.publicKey
      );

      // eslint-disable-next-line
      const [pda, nonce] = await PublicKey.findProgramAddress([Buffer.from(utils.bytes.utf8.encode('exchange'))], exchange.programId);
      const aToBAmountA = inverseQuantity * leverage * (10 ** mintAInfo.decimals);
      const equityA = inverseQuantity * (10 ** mintAInfo.decimals);
      const positionAccount = Keypair.generate();

      const tx = await exchange.rpc.aToBInput(
        new BN(aToBAmountA),
        new BN(Date.now() + 5000 / 1000),
        inverseDirection === 'long' ? Direction.Long : Direction.Short,
        new BN(equityA),
        {
          accounts: {
            authority: provider.wallet.publicKey,
            clock: SYSVAR_CLOCK_PUBKEY,
            exchange: exchangePublicKey,
            exchangeA: currentExchange.accountA,
            exchangeB: currentExchange.accountB,
            pda,
            position: positionAccount.publicKey,
            recipient: walletTokenAccountA,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            userA: walletTokenAccountA,
            userB: walletTokenAccountB
          },
          signers: [positionAccount]
        });
      const link = 'https://explorer.solana.com/tx/' + tx;

      message = 'Order Successfully Placed';
      description = (<div>Your transaction signature is <a href={link} rel='noreferrer' target='_blank'><code>{tx}</code></a></div>);

      setInversePositionAccount(positionAccount);
      setInverseStep(0);
      setLeverage(1);
      setInverseQuantity();
      getInverseDataCallback(currentExchange.symbol);
    } catch (err) {
      description = 'Transaction error';
      message = 'Order Error';
      console.log(err);
    }

    notification.open({message: message, description: description, duration: 0, placement: 'bottomLeft'});
  }

  async function approveBond() {
    let message;
    let description;

    try {
      const provider = await getProviderCallback();
      const exchange = new Program(exchangeIdl, new PublicKey(exchangeIdl.metadata.address), provider);

      const tokenA = new Token(provider.connection, new PublicKey(currentExchange.tokenA), TOKEN_PROGRAM_ID);
      const tokenB = new Token(provider.connection, new PublicKey(currentExchange.tokenB), TOKEN_PROGRAM_ID);
      const tokenC = new Token(provider.connection, new PublicKey(accounts.factory.tokenC), TOKEN_PROGRAM_ID);
      const tokenV = new Token(provider.connection, new PublicKey(currentExchange.tokenV), TOKEN_PROGRAM_ID);

      const mintInfoA = await tokenA.getMintInfo();
      const mintInfoB = await tokenB.getMintInfo();

      const walletTokenAccountA = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenA.publicKey,
        provider.wallet.publicKey
      );
      const walletTokenAccountB = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenB.publicKey,
        provider.wallet.publicKey
      );
      const walletTokenAccountC = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenC.publicKey,
        provider.wallet.publicKey
      );

      // TODO: SOL account is not associated token address
      const walletTokenAccountV = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenV.publicKey,
        provider.wallet.publicKey
      );

      // TODO: Not accurate
      const maxAmountA = bondDeposit * (10 ** mintInfoA.decimals);
      const amountB = (maxAmountA / (currentMarketPrice * (10 ** mintInfoA.decimals))) * (10 ** mintInfoB.decimals);
      const minLiquidityC = amountB / 1000;
      // eslint-disable-next-line
      const [pda, nonce] = await PublicKey.findProgramAddress([Buffer.from(utils.bytes.utf8.encode('exchange'))], exchange.programId);

      const tx = await exchange.rpc.bond(
        new BN(maxAmountA.toFixed(0)),
        new BN(amountB.toFixed(0)),
        new BN(minLiquidityC.toFixed(0)),
        new BN(Date.now() + 5000 / 1000), {
          accounts: {
            authority: provider.wallet.publicKey,
            clock: SYSVAR_CLOCK_PUBKEY,
            exchange: currentExchange.account,
            exchangeA: currentExchange.accountA,
            exchangeB: currentExchange.accountB,
            exchangeV: currentExchange.accountV,
            mint: new PublicKey(accounts.factory.tokenC),
            tokenProgram: TOKEN_PROGRAM_ID,
            userA: walletTokenAccountA,
            userB: walletTokenAccountB,
            userC: walletTokenAccountC,
            userV: walletTokenAccountV
          }
        });
      const link = 'https://explorer.solana.com/tx/' + tx;

      description = (<div>Your transaction signature is <a href={link} rel='noreferrer' target='_blank'><code>{tx}</code></a></div>);
      message = 'Order Successfully Place';

      getInverseDataCallback(currentExchange.symbol);
    } catch (err) {
      description = 'There was an error with your order';
      message = 'Order Error';
      console.log(err);
    }

    notification.open({description: description, duration: 0, message: message, placement: 'bottomLeft'});

    setBondDeposit();
  }

  async function approveStake() {
    let description;
    let message;

    try {
      const provider = await getProviderCallback();
      const factory = new Program(factoryIdl, new PublicKey(factoryIdl.metadata.address), provider);

      const tokenC = new Token(provider.connection, new PublicKey(accounts.factory.tokenC), TOKEN_PROGRAM_ID);
      const tokenS = new Token(provider.connection, new PublicKey(accounts.factory.tokenS), TOKEN_PROGRAM_ID);
      const mintInfoC = await tokenC.getMintInfo();

      const walletTokenAccountC = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenC.publicKey,
        provider.wallet.publicKey
      );
      const walletTokenAccountS = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenS.publicKey,
        provider.wallet.publicKey
      );

      const amountC = stakeDeposit * (10 ** mintInfoC.decimals);

      const tx = await factory.rpc.stake(
        new BN(amountC), {
          accounts: {
            authority: provider.wallet.publicKey,
            factory: new PublicKey(accounts.factory.account),
            factoryC: new PublicKey(accounts.factory.accountC),
            mintS: tokenS.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            userC: walletTokenAccountC,
            userS: walletTokenAccountS,
          }
        }
      );
      const link = 'https://explorer.solana.com/tx/' + tx;

      description = (<div>Your transaction signature is <a href={link} rel='noreferrer' target='_blank'><code>{tx}</code></a></div>);
      message = 'Stake Successfully Placed';
    } catch (err) {
      description = 'Transaction error';
      message = 'Stake Error';
      console.log(err);
    }

    setStakeStep(0);
    setStakeDeposit();

    notification.open({description: description, duration: 0, message: message, placement: 'bottomLeft'});
  }

  function calculateCountdown() {
    const today = new Date();
    const deadline = new Date();
    deadline.setHours(24, 0, 0, 0);
    const delta = deadline.getTime() - today.getTime();
    const hours = Math.floor((delta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((delta % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((delta % (1000 * 60)) / 1000);
    setCountdown(('0' + hours).slice(-2) + ':' + ('0' + mins).slice(-2) + ':' + ('0' + secs).slice(-2));
  }

  const settingsMenu = (
    <Menu>
      <Menu.Item key='github' onClick={() => window.open(githubUrl, '_blank')}>GitHub</Menu.Item>
      <Menu.Item key='discord'>Discord</Menu.Item>
    </Menu>
  );

  const assetTitleModal = (
    <Button className='AssetTitleModal' type='link' onClick={() => setIsInverseAssetModalVisible(true)}>{inverseAsset} <DownOutlined/></Button>
  );

  const inverseStatsBar = (
    <Row className='InverseStatsBar'>
      <Col span={3}></Col>
      <Col span={3}>
        <p><small>Market / Index</small></p>
        <Title level={5} className='Title Dark Green'>{currentMarketPrice}<span className='White'> / {indexPrice}</span></Title>
      </Col>
      <Col span={3}>
        <p><small>24H Change (%)</small></p>
        <Title level={5} className='Title Dark Green'>{change24H}</Title>
      </Col>
      <Col span={3}>
        <p><small>24H High</small></p>
        <Title level={5} className='Title Dark'>{high24H}</Title>
      </Col>
      <Col span={3}>
        <p><small>24H Low</small></p>
        <Title level={5} className='Title Dark'>{low24H}</Title>
      </Col>
      <Col span={3}>
        <p><small>24H Turnaround ({inverseAsset})</small></p>
        <Title level={5} className='Title Dark'>{turnaround24H}</Title>
      </Col>
      <Col span={3}>
        <p><small>Funding (%) / Countdown</small></p>
        <Title level={5} className='Title Dark'><span className='Yellow'>{fundingRate}</span> / {countdown}</Title>
      </Col>
      <Col span={3}></Col>
    </Row>
  );

  const inverseQuantityDescription = (
    <small>Your order amount of <span className='White'>{inverseQuantity > 0 ? (inverseQuantity / 1).toFixed(2) : 0} USD</span> equals <span
        className='White'>{inverseQuantity > 0 ? (inverseQuantity / currentMarketPrice).toFixed(2) : 0} {inverseAsset}</span></small>
  );

  const approveDescription = (<small>This transaction requires <span className='White'>{gasFee > 0 ? (gasFee / 1).toFixed(2) : 0} SOL</span></small>);

  const leverageDescription = (
    <small>At <span className='White'>{leverage}x</span> leverage your position is worth <span className='White'>
        {inverseQuantity > 0 ? (inverseQuantity / currentMarketPrice * leverage).toFixed(2) : 0} {inverseAsset}</span></small>
  );

  const inverseView = (
    <>
      {inverseStatsBar}
      <br/>
      <Row>
        <Col span={6}></Col>
        { inverseCard === 'inverse' ?
        <>
          <Col span={8} className='Cards'>
            <div className='site-card-border-less-wrapper'>
              <Card title={assetTitleModal} className='Card Dark' bordered={false}
                extra={<a href='/#/inverse' className='CardLink' onClick={() => setInverseCard('positions')}>Positions</a>}>
                <p><strong>Quantity</strong></p>
                <Input className='InverseInput Input Dark' value={inverseQuantity} placeholder='0'
                  addonAfter={<Select defaultValue='USD' className='select-after'><Option value='USD'>USD</Option></Select>}
                  onChange={(e) => {setInverseQuantity(e.target.value); setInverseStep(1)}}/>
                <br/>
                <p>Your current exchange rate is 1 USD = {exchangeRate} {inverseAsset}</p>
                <Radio.Group onChange={(e) => setInverseDirection(e.target.value)} className='RadioGroup Dark' optionType='button' buttonStyle='solid'
                  value={inverseDirection}>
                  <Radio.Button className='BuyButton' value='long'>Buy / Long</Radio.Button>
                  <Radio.Button className='SellButton' value='short'>Sell / Short</Radio.Button>
                </Radio.Group>
                <br/>
                <br/>
                <p><strong>{leverage}x Leverage</strong></p>
                <Slider defaultValue={1} min={1} onAfterChange={(e) => {setLeverage(e); setInverseStep(2)}}/>
                <br/>
                <Button size='large' disabled={!wallet.connected} onClick={approveInverse} className='InverseButton Button Dark' type='ghost'>
                  Approve
                </Button>
              </Card>
            </div>
          </Col>
          <Col span={1}></Col>
          <Col span={3}>
            <Steps direction='vertical' current={inverseStep}>
              <Step key='set' title='Quantity' description={inverseQuantityDescription}/>
              <Step key='collateral' title='Leverage' description={leverageDescription}/>
              <Step key='order' title='Approve' description={approveDescription}/>
            </Steps>
          </Col>
        </> :
        <Col span={12} className='Cards'>
          <div className='site-card-border-less-wrapper'>
            <Card title={assetTitleModal} className='Card Dark' bordered={false}
              extra={<a href='/#/inverse' className='CardLink' onClick={() => setInverseCard('inverse')}>Inverse</a>}>
              <Table dataSource={inversePositions} columns={inversePositionsColumns} pagination={false}/>
            </Card>
          </div>
        </Col>
        }
        <Col span={6}></Col>
      </Row>
    </>
  );

  const bondView = (
    <Row>
      <Col span={8}></Col>
      <Col span={8} className='Cards'>
        { bondCard === 'bond' ?
        <div className='site-card-border-less-wrapper'>
          <Card className='Card Dark' title={assetTitleModal} bordered={false}
            extra={<a href='/#/bond' className='CardLink' onClick={(e) => setBondCard('positions')}>Positions</a>}>
            <Input className='StakeInput Input Dark' value={bondDeposit} placeholder='0' onChange={(e) => setBondDeposit(e.target.value)}/>
            <br/>
            <p>Your current balance is <strong>{balance > 0 ? (balance / 1).toFixed(2) : 0}</strong></p>
            <Button size='large' disabled={!wallet.connected} className='ApproveButton Button Dark' type='ghost' onClick={approveBond}>Approve</Button>
          </Card>
        </div> :
        <div className='site-card-border-less-wrapper'>
          <Card className='Card Dark' title={assetTitleModal} bordered={false}
            extra={<a href='/#/bond' className='CardLink' onClick={(e) => setBondCard('bond')}>Bond</a>}>
          </Card>
        </div>
        }
      </Col>
      <Col span={8}></Col>
    </Row>
  );

  const stakeDescription = (
    <small>Your deposit of <span className='White'>{stakeDeposit > 0 ? (stakeDeposit / 1).toFixed(2) : 0} {CHERUB.symbol.toUpperCase()}</span>&nbsp;
      is set to earn <span className='White'>12% APY</span>
    </small>
  );

  const stakeView = (
    <Row>
      <Col span={6}></Col>
      { stakeCard === 'stake' ?
      <>
        <Col span={4}>
          <Steps direction='vertical' current={stakeStep}>
            <Step key='set' title='Quantity' description={stakeDescription}/>
            <Step key='deposit' title='Approve' description={approveDescription}/>
          </Steps>
        </Col>
        <Col span={1}></Col>
        <Col span={7} className='Cards'>
          <div className='site-card-border-less-wrapper'>
            <Card className='Card Dark' title={CHERUB.symbol} bordered={false}
              extra={<a href='/#/stake' className='CardLink' onClick={() => setStakeCard('positions')}>Positions</a>}>
              <Input className='StakeInput Input Dark' value={stakeDeposit} placeholder='0'
                onChange={(e) => {setStakeStep(1); setStakeDeposit(e.target.value)}}/>
              <br/>
              <p>Your current balance is <strong>{balance > 0 ? (balance / 1).toFixed(2) : 0}</strong></p>
              <Button size='large' disabled={!wallet.connected} className='ApproveButton Button Dark' type='ghost' onClick={approveStake}>Approve</Button>
            </Card>
          </div>
        </Col>
      </> :
      <Col span={12} className='Cards'>
        <Card className='Card Dark' title={CHERUB.symbol} bordered={false}
          extra={<a href='/#/stake' className='CardLink' onClick={() => setStakeCard('stake')}>Stake</a>}>
        </Card>
      </Col>
      }
      <Col span={6}></Col>
    </Row>
  );

  const daoView = (
    <>
      { daoCard === 'statistics' ?
      <Row>
        <Col span={2}></Col>
        <Col span={20} className='Cards'>
          <div className='site-card-border-less-wrapper'>
            <Card className='Card Dark' title='DAO' bordered={false} extra={<a href='/#/dao' className='CardLink' onClick={() => setDAOCard('vote')}>
                Vote</a>}>
              <Row>
                <Col span={6}>
                  <p>Market Cap</p>
                  <Title level={3} className='Title Dark'>{cMarketCap}</Title>
                </Col>
                <Col span={6}>
                  <p>{CHERUB.symbol} Price</p>
                  <Title level={3} className='Title Dark'>{cCurrentPrice}</Title>
                </Col>
                <Col span={6}>
                  <p>Circulating Supply (Total)</p>
                  <Title level={3} className='Title Dark'>{cCirculatingSupplyTotal}</Title>
                </Col>
                <Col span={6}>
                  <p>Markets</p>
                  <Title level={3} className='Title Dark'>{tokenCount}</Title>
                </Col>
              </Row>
              <br/>
              <Row>
                <Col span={12}>
                  <p>Total Value Deposited</p>
                  <Line height={100} data={tvdData} options={chartOptions}/>
                </Col>
                <Col span={12}>
                  <p>Market Value of Treasury Assets</p>
                  <Line height={100} data={treasuryData} options={chartOptions}/>
                </Col>
              </Row>
            </Card>
          </div>
        </Col>
        <Col span={2}></Col>
      </Row> :
      <Row>
        <Col span={2}></Col>
        <Col span={20} className='Cards'>
          <div className='site-card-border-less-wrapper'>
            <Card className='Card Dark' title='DAO' bordered={false}
              extra={<a href='/#/dao' className='CardLink' onClick={(e) => setDAOCard('statistics')}>Statistics</a>}>
              <List itemLayout='horizontal' dataSource={daoProposals} renderItem={item => (<List.Item><List.Item.Meta title={item.title}
                description={item.description}/>{item.icon}</List.Item>)}
              />
            </Card>
          </div>
        </Col>
        <Col span={2}></Col>
      </Row>
      }
    </>
  );

  useEffect(() => {
    if (!isBlockHeightIntervalSet) {
      setIsBlockHeightIntervalSet(true);
      setInterval(getBlockHeightCallback, 10000);
    }
  }, [isBlockHeightIntervalSet, getBlockHeightCallback]);

  useEffect(() => {
    if (!isCountdownIntervalSet) {
      setIsCountdownIntervalSet(true);
      setInterval(calculateCountdown, 1000);
    }
  }, [isCountdownIntervalSet, setIsCountdownIntervalSet]);

  useEffect(() => {
    setMenu(getWindowRoute());
  }, [setMenu]);

  useEffect(() => {
    if (!isInverseDataSet) {
      setIsInverseDataSet(true);
      setCurrentExchange(accounts.exchanges.find((x) => x.symbol === DEFAULT_SYMBOL));
      getInverseDataCallback(DEFAULT_SYMBOL);
    }
  }, [currentExchange.token, currentExchange.accountV, getInverseDataCallback, isInverseDataSet]);

  useEffect(() => {
    // TODO: This fires every second which is too often
    getDashboardDataCallback();
  }, [getDashboardDataCallback]);

  useEffect(() => {
    // TODO: This fires every second which is too often
    if (wallet.connected) {
      getBalanceCallback();
      getPositionsCallback();
    }
  }, [getBalanceCallback, getPositionsCallback, wallet.connected]);

  return (
    <Layout className='App Dark'>
      { !IS_LOCALHOST ?
      <Alert type='info' className='Banner' message=<small>You are currently using an unaudited piece of software via {network}. Use at your own risk.
      </small>/> : null
      }
      <Header className='Header Dark'>
        <Row>
          <Col span={6}>
            <div className='Logo Dark'>
              <img src='/logo.svg' alt='Logo' className='LogoImage'/>
              <strong className='LogoText' onClick={() => window.open(githubUrl, '_blank')}>{logoText}</strong>
            </div>
          </Col>
          <Col span={12} className='ColCentered'>
            <Menu className='Menu Dark' onClick={(e) => {setMenu(e.key); window.location.href = '/#/' + e.key}} selectedKeys={[menu]}
              mode='horizontal'>
              <Menu.Item key='dao'><BankOutlined/>&nbsp; DAO</Menu.Item>
              <Menu.Item key='inverse'><DollarOutlined/>&nbsp; Inverse Perpetuals</Menu.Item>
              <Menu.Item key='bond'><HistoryOutlined/>&nbsp; Bond</Menu.Item>
              <Menu.Item key='stake'
                onClick={() => {setInverseAsset(CHERUB.symbol); setCurrentExchange(accounts.exchanges.find((x) => x.symbol === CHERUB.symbol))}}>
                <PieChartOutlined/>&nbsp; Stake
              </Menu.Item>
            </Menu>
          </Col>
          <Col span={6} className='ConnectWalletHeader'>
            { !wallet.connected ?
            <>
              <WalletMultiButton className='WalletMultiButton'/>
              <Button className='ConnectWalletButton' onClick={(e) => document.getElementsByClassName('WalletMultiButton')[0].click()} type='link'>
                Connect Wallet
              </Button>
            </> :
            <Button className='ConnectWalletButton' type='link'>
              <code className='SolCount'>{balance > 0 ? (balance / 1).toFixed(2) : 0 } {inverseAsset}</code>
              <code>{wallet.publicKey.toString().substr(0, 4)}...{wallet.publicKey.toString().substr(-4)}</code>
            </Button>
            }
            <Dropdown className='Dropdown SettingsDropdown' overlay={settingsMenu}><SettingOutlined/></Dropdown>
          </Col>
        </Row>
      </Header>
      <Layout className='Layout Dark'>
        <Content>
          <div>
            <br/>
            <br/>
            { menu === 'inverse' ? inverseView : null }
            { menu === 'stake' ? stakeView : null }
            { menu === 'bond' ? bondView : null }
            { menu === 'dao' ? daoView : null }
          </div>
        </Content>
      </Layout>
      <Footer className='Footer'><code className='BlockHeight'><small>• {blockHeight}</small></code>
      </Footer>
      <Modal title='Assets' footer={null} visible={isInverseAssetModalVisible} onCancel={() => {setIsInverseAssetModalVisible(false)}}>
        <List itemLayout='horizontal' dataSource={accounts.exchanges} forcerender='true' renderItem={exchange => (
          <List.Item className='Asset ListItem'>
            <List.Item.Meta title={exchange.symbol} onClick={() => {
              setInverseAsset(exchange.symbol); getInverseData(exchange.symbol); setIsInverseAssetModalVisible(false);
              setCurrentExchange(accounts.exchanges.find((x) => x.symbol === exchange.symbol)); }}/>
        </List.Item>)}/>
      </Modal>
    </Layout>
  );
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint={network}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App/>
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);

export default AppWithProvider;
