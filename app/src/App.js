import {
  Alert, Button, Card, Col, Dropdown, Input, Layout, List, Modal, Menu, Radio, Row, Select, Slider, Steps, Typography, message,
  notification
} from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, DownOutlined, SettingOutlined } from '@ant-design/icons';
import { BN, Program, Provider, utils } from '@project-serum/anchor';
import { useEffect, useCallback, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { ConnectionProvider, WalletProvider, useWallet  } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { getPhantomWallet, getSlopeWallet, getSolletWallet } from '@solana/wallet-adapter-wallets';
import { Connection, Keypair, PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';

import 'antd/dist/antd.css';
import './App.css';

import exchangeIdl from './exchange.json';
import factoryIdl from './factory.json';

var accounts = {};

if (window.location.origin === 'http://127.0.0.1:3000') {
  accounts = require('./accounts-localnet.json');
} else {
  accounts = require('./accounts-devnet.json');
}

const { Content, Footer, Header } = Layout;
const { Option } = Select;
const { Step } = Steps;
const { Title } = Typography;

const Direction = {
  Long: { long: {} },
  Short: { short: {} },
};

const CHERUB = accounts.exchanges.find((x) => x.symbol === 'CHRB');
const SOL = accounts.exchanges.find((x) => x.symbol === 'SOL');
const githubUrl = 'https://www.github.com/cherub-so/cherub-protocol';
const logoText = 'cheruβ';
const network = window.location.origin === 'http://127.0.0.1:3000' ? 'http://127.0.0.1:8899' : clusterApiUrl('devnet');
const opts = { preflightCommitment: 'processed' };
const showBanner = network !== 'http://127.0.0.1:8899';
const wallets = [getPhantomWallet(), getSolletWallet(), getSlopeWallet()];

const DEFAULT_NAME = getWindowRoute() === 'stake' ? CHERUB.symbol : SOL.symbol;

const chartOptions = {
  scales: {
    x: {
      display: true,
      grid: {
        display: false
      },
    },
    y: {
      display: true,
      grid: {
        display: false
      },
    }
  },
  plugins: {
    legend: { display: false }
  }
}

const daoProposals = [{
  title: 'Move SOL/COPE stake to SOL/MANGO',
  description: '4 • September 25th, 2021',
  icon: <ClockCircleOutlined className='ClockCircleOutlined'/>
}, {
  title: 'Contributor Grant: Tim Su',
  description: '3 • Executed September 12th, 2021',
  icon: <CheckCircleOutlined className='CheckCircleOutlined'/>
}, {
  title: 'Add AAVE, SUSHI, YFI',
  description: '2 • Executed September 2nd, 2021',
  icon: <CloseCircleOutlined className='CloseCircleOutlined'/>
}, {
  title: 'Set Pause Guardian to Community Multi-Sig',
  description: '1 • Executed September 1st, 2021',
  icon: <CheckCircleOutlined className='CheckCircleOutlined'/>
}];

const treasuryData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [{
    data: [0, 7, 6, 10, 24, 51, 54, 176],
    fill: true,
    borderColor: '#40a9ff',
    backgroundColor: '#69c0ff',
  }]
};

const tvdData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [{
    data: [0, 5, 10, 33, 35, 51, 54, 76],
    fill: true,
    borderColor: '#40a9ff',
    backgroundColor: '#69c0ff'
  }]
};

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
  const [blockHeightInterval, setBlockHeightInterval] = useState(false);
  const [bondDeposit, setBondDeposit] = useState();
  const [cCirculatingSupplyTotal, setCCirculatingSupplyTotal] = useState('0 / 0');
  const [cCurrentPrice, setCCurrentPrice] = useState(0);
  const [cMarketCap, setCMarketCap] = useState(0);
  const [change24H, setChange24H] = useState();
  // eslint-disable-next-line
  const [countdown, setCountdown] = useState('');
  const [countdownInterval, setCountdownInterval] = useState(false);
  const [currentMarket, setCurrentMarket] = useState();
  const [exchangeRate, setExchangeRate] = useState(0);
  const [fundingRate, setFundingRate] = useState();
  // eslint-disable-next-line
  const [gasFee, setGasFee] = useState();
  const [high24H, setHigh24H] = useState();
  const [isInverseAssetModalVisible, setIsInverseAssetModalVisible] = useState(false);
  const [isInverseDataSet, setIsInverseSet] = useState(false);
  const [indexPrice, setIndexPrice] = useState();
  const [leverage, setLeverage] = useState(1);
  const [low24H, setLow24H] = useState();
  const [menu, setMenu] = useState('');
  const [daoCard, setDAOCard] = useState('statistics');
  const [stakeCard, setStakeCard] = useState('stake');
  const [stakeDeposit, setStakeDeposit] = useState();
  const [stakeStep, setStakeStep] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);
  const [inverseAsset, setInverseAsset] = useState(DEFAULT_NAME);
  const [inverseCard, setInverseCard] = useState('inverse');
  const [inverseDirection, setInverseDirection] = useState('long');
  const [inverseQuantity, setInverseQuantity] = useState();
  const [inverseStep, setInverseStep] = useState(0);
  const [turnaround24H, setTurnaround24H] = useState();

  const wallet = useWallet();

  const getProviderCallback = useCallback(getProvider, [getProvider]);

  const getBalanceCallback = useCallback(getBalance, [getProviderCallback, inverseAsset, wallet.connected, wallet.publicKey]);
  const getDashboardDataCallback = useCallback(getDashboardData, [getProviderCallback]);
  const getFactoryDataCallback = useCallback(getFactoryData, [getProviderCallback]);
  const getInverseDataCallback = useCallback(getInverseData, [getProviderCallback]);

  async function getProvider() {
    const connection = new Connection(network, opts.preflightCommitment);
    return new Provider(connection, wallet, opts.preflightCommitment);
  }

  async function getBalance() {
    const provider = await getProviderCallback();
    const inverseExchange = accounts.exchanges.find((x) => x.symbol === inverseAsset);
    if (wallet.connected) {
      if (inverseExchange.token === SOL.token) {
        const balance = await provider.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      } else {
        const tokenV = new Token(provider.connection, new PublicKey(inverseExchange.token), TOKEN_PROGRAM_ID);
        const accountVInfo = await tokenV.getAccountInfo(new PublicKey(inverseExchange.walletV));
        const mintVInfo = await tokenV.getMintInfo();
        setBalance((accountVInfo.amount.toNumber() / (1 ** mintVInfo.decimals)).toFixed(2));
      }
    }
  }

  async function getFactoryData() {
    const provider = await getProviderCallback();
    const factory = new Program(factoryIdl, new PublicKey(factoryIdl.metadata.address), provider);
    try {
      const account = await factory.account.factoryData.fetch(new PublicKey(accounts.factory));
      setTokenCount(account.tokenCount.toNumber());
    } catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  async function getDashboardData() {
    const provider = await getProviderCallback();
    const exchange = new Program(exchangeIdl, new PublicKey(exchangeIdl.metadata.address), provider);
    try {
      const tokenC = new Token(provider.connection, new PublicKey(accounts.mintC), TOKEN_PROGRAM_ID);
      const tokenS = new Token(provider.connection, new PublicKey(accounts.mintS), TOKEN_PROGRAM_ID);
      const mintCInfo = await tokenC.getMintInfo();
      const mintSInfo = await tokenS.getMintInfo();
      const supply = mintSInfo.supply.toNumber() / (1 ** mintSInfo.decimals);
      const total = mintCInfo.supply.toNumber() / (1 ** mintCInfo.decimals);
      setCCirculatingSupplyTotal(supply.toFixed(0) + ' / ' + total.toFixed(0));
      const exchangeDataAccount = await exchange.account.exchangeData.fetch(new PublicKey(CHERUB.exchange));
      const lastPrice = (exchangeDataAccount.lastPrice.toNumber() / (mintCInfo.decimals * 10)).toFixed(2);
      setCCurrentPrice((lastPrice / 1).toFixed(0));
      setCMarketCap((lastPrice / 1).toFixed(0));
    } catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  function networkErrorMessage() {
    message.info('Unable to connect to network');
  }

  function setDummyInverseData(lastPrice) {
    const marketIndex = lastPrice * (Math.random() / 100 + 0.9);
    setChange24H('+' + (lastPrice > 0 ? (Math.random() / 100 + 2).toFixed(2) : 0) + '%');
    setCurrentMarket(lastPrice);
    setFundingRate(lastPrice > 0 ? ((lastPrice - marketIndex) / 1000).toFixed(4) : 0);
    setHigh24H((lastPrice * (Math.random() / 100 + 1.1)).toFixed(2));
    setIndexPrice(marketIndex.toFixed(2));
    setLow24H((lastPrice * (Math.random() / 100 + 0.9)).toFixed(2));
    setTurnaround24H((lastPrice * (Math.random() * 10000 + 1.3)).toFixed(0));
  }

  async function getInverseData(asset) {
    const provider = await getProviderCallback();
    const exchangePublicKey = new PublicKey(accounts.exchanges.find((x) => x.symbol === asset).exchange);
    const exchange = new Program(exchangeIdl, new PublicKey(exchangeIdl.metadata.address), provider);

    try {
      const exchangeAccount = await exchange.account.exchangeData.fetch(exchangePublicKey);
      const mintAPublicKey = accounts.exchanges.find((x) => x.symbol === asset).mintA;
      const tokenA = new Token(provider.connection, new PublicKey(mintAPublicKey), TOKEN_PROGRAM_ID, null);
      const mintAInfo = await tokenA.getMintInfo();
      const lastPrice = (exchangeAccount.lastPrice.toNumber() / (1 ** mintAInfo.decimals)).toFixed(2);

      setDummyInverseData(lastPrice);
      setExchangeRate(lastPrice);
    } catch (err) {
      console.log('Transaction error: ', err);
    }

    setInverseStep(0);
    setInverseQuantity();
  }

  async function approveInverse() {
    const provider = await getProviderCallback();

    const inverseExchange = accounts.exchanges.find((x) => x.symbol === inverseAsset);

    const exchange = new Program(exchangeIdl, new PublicKey(exchangeIdl.metadata.address), provider);
    const exchangePublicKey = new PublicKey(inverseExchange.exchange);

    const tokenA = new Token(provider.connection, new PublicKey(inverseExchange.mintA), TOKEN_PROGRAM_ID, null);
    const mintAInfo = await tokenA.getMintInfo();
    const exchangeTokenAccountA = inverseExchange.tokenA;
    const exchangeTokenAccountB = inverseExchange.tokenB;

    // eslint-disable-next-line
    const walletAssociatedAccountX = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      wallet.publicKey,
      wallet.publicKey
    );

    // eslint-disable-next-line
    const associatedTokenAccountA = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      wallet.publicKey,
      wallet.publicKey
    );
    // TODO: Make PDA
    const walletTokenAccountA = inverseExchange.walletA;
    const walletTokenAccountB = inverseExchange.walletB;

    // eslint-disable-next-line
    const [pda, nonce] = await PublicKey.findProgramAddress([Buffer.from(utils.bytes.utf8.encode('exchange'))], exchange.programId);
    const aToBAmountA = new BN(inverseQuantity * leverage * (1 ** mintAInfo.decimals));
    const equityA = new BN(inverseQuantity * (1 ** mintAInfo.decimals));

    // TODO: Make PDA
    const exchangePositionAccount = Keypair.generate();

    try {
      const tx = await exchange.rpc.aToBInput(
        aToBAmountA,
        new BN(Date.now() + 5000 / 1000),
        inverseDirection === 'long' ? Direction.Long : Direction.Short,
        equityA,
        {
          accounts: {
            authority: provider.wallet.publicKey,
            clock: SYSVAR_CLOCK_PUBKEY,
            exchange: exchangePublicKey,
            exchangeA: exchangeTokenAccountA,
            exchangeB: exchangeTokenAccountB,
            pda,
            position: exchangePositionAccount.publicKey,
            recipient: walletTokenAccountA,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            userA: walletTokenAccountA,
            userB: walletTokenAccountB
          },
          signers: [exchangePositionAccount]
        });

      const link = 'https://explorer.solana.com/tx/' + tx;

      notification.open({
        message: 'Order Successfully Placed',
        description: <div>Your transaction signature is <a href={link} rel='noreferrer' target='_blank'><code>{tx}</code></a></div>,
        duration: 0,
        placement: 'bottomLeft'
      });

      setInverseStep(0);
      setLeverage(1);
      setInverseQuantity();

      getInverseDataCallback(inverseExchange.symbol);
    } catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  async function approveBond() {
    const provider = await getProviderCallback();

    const inverseExchange = accounts.exchanges.find((x) => x.symbol === inverseAsset);
    const exchange = new Program(exchangeIdl, new PublicKey(exchangeIdl.metadata.address), provider);
    const tokenA = new Token(provider.connection, new PublicKey(inverseExchange.mintA), TOKEN_PROGRAM_ID);
    const mintAInfo = await tokenA.getMintInfo();

    // TODO: Do not pull from accounts file but get from browser via PDA
    // eslint-disable-next-line
    const walletAssociatedAccountX = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      wallet.publicKey,
      wallet.publicKey
    );
    const walletTokenAccountA = inverseExchange.walletA;
    const walletTokenAccountB = inverseExchange.walletB;
    const walletTokenAccountC = accounts.walletC;
    const walletTokenAccountV = inverseExchange.walletV;

    // eslint-disable-next-line
    const [pda, nonce] = await PublicKey.findProgramAddress(
      [Buffer.from(utils.bytes.utf8.encode('exchange'))],
      exchange.programId
    );
    const amountA = new BN(bondDeposit * (1 ** mintAInfo.decimals));
    const amountB = amountA / 2;
    // TODO: Calculate this correctly
    const minC = amountB * (1 ** 9) / 3;

    try {
      const tx = await exchange.rpc.bond(
        new BN(amountA),
        new BN(amountB),
        new BN(minC),
        new BN(Date.now() + 5000 / 1000), {
          accounts: {
            authority: provider.wallet.publicKey,
            clock: SYSVAR_CLOCK_PUBKEY,
            exchange: inverseExchange.exchange,
            exchangeA: inverseExchange.walletA,
            exchangeB: inverseExchange.walletB,
            exchangeV: inverseExchange.walletV,
            mint: new PublicKey(accounts.mintC),
            tokenProgram: TOKEN_PROGRAM_ID,
            userA: walletTokenAccountA,
            userB: walletTokenAccountB,
            userC: walletTokenAccountC,
            userV: walletTokenAccountV
          },
          signers: [provider.wallet.owner]
        });
      const link = 'https://explorer.solana.com/tx/' + tx;

      notification.open({
        message: 'Order Successfully Placed',
        description: <div>Your transaction signature is <a href={link} rel='noreferrer' target='_blank'><code>{tx}</code></a></div>,
        duration: 0,
        placement: 'bottomLeft'
      });

      setInverseStep(0);
      setLeverage(1);
      setInverseQuantity();

      getInverseDataCallback(inverseExchange.symbol);
    } catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  async function approveStake() {
    const provider = await getProviderCallback();
    const factory = new Program(factoryIdl, new PublicKey(factoryIdl.metadata.address), provider);

    const tokenC = new Token(provider.connection, new PublicKey(accounts.mintC), TOKEN_PROGRAM_ID);
    const tokenS = new Token(provider.connection, new PublicKey(accounts.mintS), TOKEN_PROGRAM_ID);
    const mintCInfo = await tokenC.getMintInfo();

    // TODO: Do not pull from accounts file but get from browser via PDA
    // eslint-disable-next-line
    const walletAssociatedAccountX = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      wallet.publicKey,
      wallet.publicKey
    );
    const walletTokenAccountC = accounts.walletC;
    const walletTokenAccountS = accounts.walletS;

    const amountC = new BN(stakeDeposit * (1 ** mintCInfo.decimals));

    try {
      const tx = await factory.rpc.stake(
        new BN(amountC), {
          accounts: {
            authority: provider.wallet.publicKey,
            factory: new PublicKey(accounts.factory),
            factoryC: new PublicKey(accounts.factoryC),
            mintS: tokenS.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            userS: walletTokenAccountS,
            userC: walletTokenAccountC
          },
          signers: [provider.wallet.owner]
        }
      );
      const link = 'https://explorer.solana.com/tx/' + tx;

      notification.open({
        message: 'Order Successfully Placed',
        description: <div>Your transaction signature is <a href={link} rel='noreferrer' target='_blank'><code>{tx}</code></a></div>,
        duration: 0,
        placement: 'bottomLeft'
      });

      setStakeStep(0);
      setStakeDeposit();
    } catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  // TODO: No longer needed with continuous funding, need to understand price oracle better
  function calculateCountdown() {
    // eslint-disable-next-line
    const today = new Date();
    // eslint-disable-next-line
    const deadline = new Date();
    deadline.setHours(24, 0, 0, 0);
    // eslint-disable-next-line
    const delta = deadline.getTime() - today.getTime();
    // eslint-disable-next-line
    const hours = Math.floor((delta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    // eslint-disable-next-line
    const mins = Math.floor((delta % (1000 * 60 * 60)) / (1000 * 60));
    // eslint-disable-next-line
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
    <Button className='AssetTitleModal' type='link'
      onClick={() => setIsInverseAssetModalVisible(true)}>{inverseAsset} <DownOutlined/></Button>
  );

  const inverseStatsBar = (
    <Row className='InverseStatsBar'>
      <Col span={3}></Col>
      <Col span={3}>
        <p><small>Market / Index</small></p>
        <Title level={5} className='Title Dark Green'>{currentMarket}<span className='White'> / {indexPrice}</span></Title>
      </Col>
      <Col span={3}>
        <p><small>24H Change</small></p>
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
        <p><small>Funding Rate</small></p>
        <Title level={5} className='Title Dark'><span className='Yellow'>{fundingRate}</span></Title>
      </Col>
      <Col span={3}></Col>
    </Row>
  );

  const inverseQuantityDescription = (
    <small>
      Your order amount of <span className='White'>{inverseQuantity > 0 ? (inverseQuantity / 1).toFixed(2) : 0} USD</span> equals <span
        className='White'>{inverseQuantity > 0 ? (inverseQuantity / currentMarket).toFixed(2) : 0} {inverseAsset}</span>
    </small>
  );

  const approveDescription = (
    <small>This transaction requires <span className='White'>{gasFee > 0 ? (gasFee / 1).toFixed(2) : 0} SOL</span></small>
  );

  const leverageDescription = (
    <small>
      At <span className='White'>{leverage}x</span> leverage your position is worth <span className='White'>
        {inverseQuantity > 0 ? (inverseQuantity / currentMarket * leverage).toFixed(2) : 0} {inverseAsset}</span>
    </small>
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
                  addonAfter={
                    <Select defaultValue='USD' className='select-after'>
                      <Option value='USD'>USD</Option>
                    </Select>
                  } onChange={(e) => {setInverseQuantity(e.target.value); setInverseStep(1)}} />
                <br/>
                <p>Your current exchange rate is 1 USD = {exchangeRate} {inverseAsset}</p>
                <Radio.Group onChange={(e) => setInverseDirection(e.target.value)} className='RadioGroup Dark'
                  optionType='button' buttonStyle='solid' value={inverseDirection}>
                  <Radio.Button className='BuyButton' value='long'>Buy / Long</Radio.Button>
                  <Radio.Button className='SellButton' value='short'>Sell / Short</Radio.Button>
                </Radio.Group>
                <br/>
                <br/>
                <p><strong>{leverage}x Leverage</strong></p>
                <Slider defaultValue={1} min={1} onAfterChange={(e) => {setLeverage(e); setInverseStep(2)}} />
                <br/>
                <Button size='large' disabled={!wallet.connected} onClick={approveInverse} className='InverseButton Button Dark'
                  type='ghost'>Approve</Button>
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
        <div className='site-card-border-less-wrapper'>
          <Card className='Card Dark' title={assetTitleModal} bordered={false}
            extra={<a href='/#/bond' className='CardLink' onClick={(e) => {}}>Positions</a>}>
            <Input className='StakeInput Input Dark' value={bondDeposit} placeholder='0'
              onChange={(e) => setBondDeposit(e.target.value)} />
            <br/>
            <p>Your current balance is <strong>{balance > 0 ? (balance / 1).toFixed(2) : 0}</strong></p>
            <Button size='large' disabled={!wallet.connected} className='ApproveButton Button Dark' type='ghost'
              onClick={approveBond}>
              Approve</Button>
          </Card>
        </div>
      </Col>
      <Col span={8}></Col>
    </Row>
  );

  const stakeDescription = (
    <small>
      Your deposit of <span className='White'>{stakeDeposit > 0 ? (stakeDeposit / 1).toFixed(2) : 0} {CHERUB.symbol.toUpperCase()}</span>
      &nbsp;is set to earn <span className='White'>12% APY</span>
    </small>
  );

  const stakeView = (
    <Row>
      <Col span={6}></Col>
      { stakeCard === 'stake' ?
      <>
        <Col span={4}>
          <Steps direction='vertical' current={stakeStep}>
            <Step key='set' title='Quantity' description={stakeDescription} />
            <Step key='deposit' title='Approve' description={approveDescription} />
          </Steps>
        </Col>
        <Col span={1}></Col>
        <Col span={7} className='Cards'>
          <div className='site-card-border-less-wrapper'>
            <Card className='Card Dark' title={CHERUB.symbol} bordered={false}
              extra={<a href='/#/stake' className='CardLink' onClick={() => setStakeCard('positions')}>Positions</a>}>
              <Input className='StakeInput Input Dark' value={stakeDeposit} placeholder='0'
                onChange={(e) => {setStakeStep(1); setStakeDeposit(e.target.value)}} />
              <br/>
              <p>Your current balance is <strong>{balance > 0 ? (balance / 1).toFixed(2) : 0}</strong></p>
              <Button size='large' disabled={!wallet.connected} className='ApproveButton Button Dark' type='ghost' onClick={approveStake}>
                Approve</Button>
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
            <Card className='Card Dark' title='DAO' bordered={false}
              extra={<a href='/#/dao' className='CardLink' onClick={() => setDAOCard('vote')}>Vote</a>}>
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
                  <Title level={3} className='Title Dark'>{cCirculatingSupplyTotal} {CHERUB.symbol}</Title>
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
              <List itemLayout='horizontal' dataSource={daoProposals}
                renderItem={item => (
                  <List.Item><List.Item.Meta title={item.title} description={item.description} />{item.icon}</List.Item>
                )}/>
            </Card>
          </div>
        </Col>
        <Col span={2}></Col>
      </Row>
      }
    </>
  );

  useEffect(() => {
    // TODO: This fires every second, minimize this
    getBalanceCallback();
    getDashboardDataCallback();
    getFactoryDataCallback();

    if (!isInverseDataSet) {
      setIsInverseSet(true);
      getInverseDataCallback(DEFAULT_NAME);
    }
  }, [getBalanceCallback, getDashboardDataCallback, getFactoryDataCallback, getInverseDataCallback, isInverseDataSet]);

  useEffect(() => {
    setMenu(getWindowRoute());
  }, [setMenu]);

  useEffect(() => {
    getProviderCallback().then(function(provider) {
      if (!blockHeightInterval) {
        try {
          setBlockHeightInterval(true);
          setInterval(function () {
            provider.connection.getEpochInfo().then(function(epochInfo) {
              setBlockHeight(epochInfo.blockHeight);
            });
          }, 10000);
        } catch (e) {
          networkErrorMessage();
        }
      }
    });
  }, [blockHeightInterval, getProviderCallback]);

  useEffect(() => {
    if (!countdownInterval) {
      try {
        setCountdownInterval(true);
        setInterval(function () {
          calculateCountdown();
        }, 1000);
      } catch (e) {
        networkErrorMessage();
      }
    }
  }, [countdownInterval, setCountdownInterval]);

  return (
    <Layout className='App Dark'>
      { showBanner ?
      <Alert type='info' className='Banner' closable
        message=<span>You are currently using an unaudited piece of software via {network}. Use at your own risk.</span> /> : null
      }
      <Header className='Header Dark'>
        <Row>
          <Col span={5}>
            <div className='Logo Dark'>
              <img src='/logo.svg' alt='Logo' className='LogoImage'/>
              <strong className='LogoText' onClick={() => window.open(githubUrl, '_blank')}>{logoText}</strong>
            </div>
          </Col>
          <Col span={14} className='ColCentered'>
            <Menu className='Menu Dark' onClick={(e) => {setMenu(e.key); window.location.href = '/#/' + e.key}} selectedKeys={[menu]}
              mode='horizontal'>
              <Menu.Item key='dao'>DAO</Menu.Item>
              <Menu.Item key='inverse'>Inverse Perpetuals</Menu.Item>
              <Menu.Item key='bond'>Bond</Menu.Item>
              <Menu.Item key='stake' onClick={() => {setInverseAsset(CHERUB.symbol)}}>Stake</Menu.Item>
            </Menu>
          </Col>
          <Col span={5} className='ConnectWalletHeader'>
            { !wallet.connected ?
            <>
              <WalletMultiButton className='WalletMultiButton'/>
              <Button className='ConnectWalletButton' onClick={(e) => document.getElementsByClassName('WalletMultiButton')[0].click()}
                type='link'>Connect Wallet</Button>
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
      <Footer className='Footer'><code className='BlockHeight'><small>• {blockHeight}</small></code></Footer>
      <Modal title='Assets' footer={null} visible={isInverseAssetModalVisible} onCancel={() => {setIsInverseAssetModalVisible(false)}}>
        <List itemLayout='horizontal' dataSource={accounts.exchanges} forcerender='true'
          renderItem={exchange => (
            <List.Item className='Asset ListItem'>
              <List.Item.Meta title={exchange.symbol}
                onClick={() => {setInverseAsset(exchange.symbol); getInverseData(exchange.symbol); setIsInverseAssetModalVisible(false)}}/>
            </List.Item>
          )}
        />
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
