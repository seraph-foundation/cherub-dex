import {
  Alert, Button, Card, Col, Dropdown, Input, Layout, List, Modal, Menu, Radio, Row, Select, Slider, Steps, Typography, message
} from 'antd';
import { DownOutlined, SettingOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Program, Provider } from '@project-serum/anchor';
import { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { getPhantomWallet, getSolletWallet, getSlopeWallet } from '@solana/wallet-adapter-wallets';
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';

import 'antd/dist/antd.css';
import './App.css';

import exchangeIdl from './exchange.json';
import factoryIdl from './factory.json';
// eslint-disable-next-line
import pythIdl from './pyth.json';

import accounts from './accounts-localnet.json';

const { Content, Footer, Header } = Layout;
const { Option } = Select;
const { Step } = Steps;
const { Title } = Typography;

const exchange0PublicKey = new PublicKey(accounts.exchanges[0]);
const exchange1PublicKey = new PublicKey(accounts.exchanges[1]);
const factoryPublicKey = new PublicKey(accounts.factory);
// eslint-disable-next-line
const pythPublicKey = new PublicKey(accounts.pyth);

const name = 'xv01';
const githubUrl = 'https://www.github.com/xv01-finance/xv01-protocol';
const network = window.location.origin === 'http://localhost:3000' ? 'http://127.0.0.1:8899' : clusterApiUrl('mainnet');
const opts = { preflightCommitment: 'processed' };
const routes = ['dashboard', 'trade', 'pool', 'stake', 'dao'];
const showBanner = false;
const tradeAssets = ['XV01', 'SOL'];
const wallets = [getPhantomWallet(), getSolletWallet(), getSlopeWallet()];

const tradeOptions = [
  { label: 'Buy / Long', value: 'long' },
  { label: 'Sell / Short', value: 'short' },
];

const tvdData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      data: [0, 5, 10, 33, 35, 51, 54, 76],
      fill: true,
      borderColor: '#40a9ff',
      backgroundColor: '#69c0ff'
    }
  ]
};

const treasuryData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      data: [0, 7, 6, 10, 24, 51, 54, 176],
      fill: true,
      borderColor: '#40a9ff',
      backgroundColor: '#69c0ff'
    }
  ]
};

const chartOptions = {
  plugins: {
    legend: { display: false }
  }
}

const daoProposals = [
  {
    title: 'Move SOL/COPE stake to SOL/MANGO',
    description: '4 • September 25th, 2021',
    icon: <ClockCircleOutlined className='ClockCircleOutlined'/>
  },
  {
    title: 'Contributor Grant: Tim Su',
    description: '3 • Executed September 12th, 2021',
    icon: <CheckCircleOutlined className='CheckCircleOutlined'/>
  },
  {
    title: 'Add AAVE, SUSHI, YFI',
    description: '2 • Executed September 2nd, 2021',
    icon: <CloseCircleOutlined className='CloseCircleOutlined'/>
  },
  {
    title: 'Set Pause Guardian to Community Multi-Sig',
    description: '1 • Executed September 1st, 2021',
    icon: <CheckCircleOutlined className='CheckCircleOutlined'/>
  }
];

function App() {
  const [balance, setBalance] = useState(0);
  const [blockHeight, setBlockHeight] = useState(0);
  const [blockHeightInterval, setBlockHeightInterval] = useState(false);
  const [cCirculatingSupplyTotal, setCirculatingSupplyTotal] = useState('0 / 0');
  const [cCurrentPrice, setCCurrentPrice] = useState(0);
  const [cMarketCap, setCMarketCap] = useState(0);
  const [change24H, setChange24H] = useState();
  const [countdown, setCountdown] = useState('');
  const [countdownInterval, setCountdownInterval] = useState(false);
  const [currentExchange, setCurrentExchange] = useState();
  const [currentMarket, setCurrentMarket] = useState();
  const [fundingRate, setFundingRate] = useState();
  // eslint-disable-next-line
  const [gasFee, setGasFee] = useState();
  const [high24H, setHigh24H] = useState();
  const [isTradeAssetModalVisible, setIsTradeAssetModalVisible] = useState(false);
  const [leverage, setLeverage] = useState(1);
  const [low24H, setLow24H] = useState();
  const [menu, setMenu] = useState('');
  const [stakeCard, setStakeCard] = useState('stake');
  const [stakeDeposit, setStakeDeposit] = useState();
  const [stakeStep, setStakeStep] = useState(0);
  // eslint-disable-next-line
  const [tokenCount, setTokenCount] = useState(0);
  const [tradeCard, setTradeCard] = useState('trade');
  const [tradeDirection, setTradeDirection] = useState('long');
  const [tradeQuantity, setTradeQuantity] = useState();
  const [tradeStep, setTradeStep] = useState(0);
  const [tradeAsset, setTradeAsset] = useState(tradeAssets[0]);
  const [turnaround24H, setTurnaround24H] = useState();

  const wallet = useWallet();

  const getProviderCallback = useCallback(getProvider, [getProvider]);

  const getDashboardCallback = useCallback(getDashboard, [getProviderCallback, currentMarket]);
  const getFactoryDataCallback = useCallback(getFactoryData, [getProviderCallback]);

  async function getProvider() {
    const connection = new Connection(network, opts.preflightCommitment);
    return new Provider(connection, wallet, opts.preflightCommitment);
  }

  async function getFactoryData() {
    const provider = await getProviderCallback();
    const program = new Program(factoryIdl, new PublicKey(factoryIdl.metadata.address), provider);
    try {
      const account = await program.account.factoryData.fetch(factoryPublicKey);
      setTokenCount(account.tokenCount.toNumber());
    } catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  async function getDashboard() {
    const provider = await getProviderCallback();
    const exchangeProgram = new Program(exchangeIdl, new PublicKey(exchangeIdl.metadata.address), provider);
    try {
      const tokenC = new Token(provider.connection, new PublicKey(accounts.mintC), TOKEN_PROGRAM_ID, null);
      const mintCInfo = await tokenC.getMintInfo();
      setCirculatingSupplyTotal(mintCInfo.supply.toNumber() + ' / ' + mintCInfo.supply.toNumber());
      const exchangeData0Account = await exchangeProgram.account.exchangeData.fetch(exchange0PublicKey);
      setCCurrentPrice(exchangeData0Account.lastPrice.toNumber());
      setCMarketCap(exchangeData0Account.lastPrice.toNumber() * exchangeData0Account.lastPrice.toNumber());

      // First exchange is always XV01
      if (currentMarket === undefined) {
        setDummyTradeData(exchangeData0Account.lastPrice.toNumber());
      }
    } catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  function networkErrorMessage() {
    message.info('Unable to connect to network');
  }

  function setDummyTradeData(lastPrice) {
    setCurrentMarket(lastPrice);
    setHigh24H((lastPrice * (Math.random() / 100 + 1)).toFixed(2));
    setLow24H((lastPrice * (Math.random() / 100 + 1)).toFixed(2));
    setTurnaround24H((lastPrice * (Math.random() / 100 + 1.1)).toFixed(2));
    setChange24H((Math.random() / 100 + 2).toFixed(2));
    setFundingRate((Math.random() / 100).toFixed(4));
  }

  async function getTrade(asset) {
    let exchangePublicKey;
    if (asset === tradeAssets[0]) {
      exchangePublicKey = exchange0PublicKey;
    } else {
      exchangePublicKey = exchange1PublicKey;
    }
    setCurrentExchange(exchangePublicKey.toString());
    const provider = await getProviderCallback();
    const program = new Program(exchangeIdl, new PublicKey(exchangeIdl.metadata.address), provider);
    try {
      const account = await program.account.exchangeData.fetch(exchangePublicKey);
      setCurrentMarket(account.lastPrice.toNumber());
      setHigh24H(account.lastPrice.toNumber() * (Math.random() / 100 + 1));
      setLow24H(account.lastPrice.toNumber() * (Math.random() / 100 + 1));
    } catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  function calculateCountdown() {
    // TODO: Use 8 hours funding cycles instead of midnight
    const today = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const t = (midnight.getTime() - today.getTime());
    const hours = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((t % (1000 * 60)) / 1000);
    setCountdown(('0' + hours).slice(-2) + ':' + ('0' + mins).slice(-2) + ':' + ('0' + secs).slice(-2));
  }

  const settingsMenu = (
    <Menu>
      <Menu.Item key='github' onClick={() => window.open(githubUrl, '_blank')}>GitHub</Menu.Item>
      <Menu.Item key='discord'>Discord</Menu.Item>
    </Menu>
  );

  const assetTitleModal = (
    <Button className='AssetTitleModal' type='link' onClick={() => setIsTradeAssetModalVisible(true)}>{tradeAsset} <DownOutlined/></Button>
  );

  const dashboardView = (
    <Row>
      <Col span={2}></Col>
      <Col span={20} className='Cards'>
        <div className='site-card-border-less-wrapper'>
          <Card className='Card Dark' title='Dashboard' bordered={false}>
            <Row>
              <Col span={8}>
                <p>Market Cap</p>
                <Title level={3} className='Title Dark'>${cMarketCap}</Title>
              </Col>
              <Col span={8}>
                <p>Price</p>
                <Title level={3} className='Title Dark'>${cCurrentPrice}</Title>
              </Col>
              <Col span={8}>
                <p>Circulating Supply (Total)</p>
                <Title level={3} className='Title Dark'>{cCirculatingSupplyTotal} {name.toUpperCase()}</Title>
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
    </Row>
  );

  const tradeStatsBar = (
    <Row className='TradeStatsBar'>
      <Col span={3}></Col>
      <Col span={3}>
        <p><small>Market</small></p>
        <Title level={4} className='Title Dark Green'>{currentMarket}</Title>
      </Col>
      <Col span={3}>
        <p><small>24H Change %</small></p>
        <Title level={4} className='Title Dark Green'>{change24H}</Title>
      </Col>
      <Col span={3}>
        <p><small>24H High</small></p>
        <Title level={4} className='Title Dark'>{high24H}</Title>
      </Col>
      <Col span={3}>
        <p><small>24H Low</small></p>
        <Title level={4} className='Title Dark'>{low24H}</Title>
      </Col>
      <Col span={3}>
        <p><small>24H Turnaround</small></p>
        <Title level={4} className='Title Dark'>{turnaround24H}</Title>
      </Col>
      <Col span={3}>
        <p><small>Funding Rate / Countdown</small></p>
        <Title level={4} className='Title Dark'><span className='Yellow'>{fundingRate}</span> / {countdown}</Title>
      </Col>
      <Col span={3}></Col>
    </Row>
  );

  const tradeQuantityDescription = (
    <small>
      Your order amount of <span className='White'>{tradeQuantity > 0 ? (tradeQuantity / 1).toFixed(2) : 0} USD</span> equals <span
        className='White'>{tradeQuantity > 0 ? (tradeQuantity / currentMarket).toFixed(2) : 0} {tradeAsset}</span>
    </small>
  );

  const approveDescription = (
    <small>This transaction requires <span className='White'>{gasFee > 0 ? (gasFee / 1).toFixed(2) : 0} SOL</span></small>
  );

  const leverageDescription = (
    <small>
      At <span className='White'>{leverage}x</span> leverage your position is worth <span className='White'>
        {tradeQuantity > 0 ? (tradeQuantity / currentMarket * leverage).toFixed(2) : 0} {tradeAsset}</span>
    </small>
  );

  const tradeView = (
    <>
      {tradeStatsBar}
      <br/>
      <Row>
        <Col span={6}></Col>
        { tradeCard === 'trade' ?
        <>
          <Col span={8} className='Cards'>
            <div className='site-card-border-less-wrapper'>
              <Card title={assetTitleModal} className='Card Dark' bordered={false}
                extra={<a href='/#/trade' className='CardLink' onClick={() => setTradeCard('positions')}>Positions</a>}>
                <p><strong>Quantity</strong></p>
                <Input className='TradeInput Input Dark' value={tradeQuantity} placeholder='0'
                  addonAfter={
                    <Select defaultValue='USD' className='select-after'>
                      <Option value='USD'>USD</Option>
                    </Select>
                  } onChange={(e) => {setTradeQuantity(e.target.value); setTradeStep(1)}} />
                <br/>
                <p>Your current balance is <strong>{balance}</strong></p>
                <Radio.Group options={tradeOptions} onChange={(e) => setTradeDirection(e.target.value)} className='RadioGroup Dark'
                  optionType='button' buttonStyle='solid' value={tradeDirection} />
                <br/>
                <br/>
                <p><strong>{leverage}x Leverage</strong></p>
                <Slider defaultValue={1} min={1} onAfterChange={(e) => {setLeverage(e); setTradeStep(2)}} />
                <br/>
                <Button size='large' disabled={!wallet.connected} className='TradeButton Button Dark' type='ghost'>Approve</Button>
              </Card>
            </div>
          </Col>
          <Col span={1}></Col>
          <Col span={3}>
            <Steps direction='vertical' current={tradeStep}>
              <Step key='set' title='Quantity' description={tradeQuantityDescription}/>
              <Step key='collateral' title='Leverage' description={leverageDescription}/>
              <Step key='order' title='Approve' description={approveDescription}/>
            </Steps>
          </Col>
        </> :
        <Col span={12} className='Cards'>
          <div className='site-card-border-less-wrapper'>
            <Card title={assetTitleModal} className='Card Dark' bordered={false}
              extra={<a href='/#/trade' className='CardLink' onClick={() => setTradeCard('trade')}>Trade</a>}>
            </Card>
          </div>
        </Col>
        }
        <Col span={6}></Col>
      </Row>
    </>
  );

  const poolView = (
    <Row>
      <Col span={6}></Col>
      <Col span={12} className='Cards'>
        <div className='site-card-border-less-wrapper'>
          <Card className='Card Dark' title={assetTitleModal} bordered={false}
            extra={<a href='/#/pool' className='CardLink' onClick={(e) => {}}>Positions</a>}>
          </Card>
        </div>
      </Col>
      <Col span={6}></Col>
    </Row>
  );

  const stakeDescription = (
    <small>
      Your deposit of <span className='White'>{stakeDeposit > 0 ? (stakeDeposit / 1).toFixed(2) : 0} {name.toUpperCase()}</span> is
      set to earn <span className='White'>12% APY</span>
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
            <Card className='Card Dark' title={assetTitleModal} bordered={false}
              extra={<a href='/#/stake' className='CardLink' onClick={() => setStakeCard('positions')}>Positions</a>}>
              <Input className='StakeInput Input Dark' value={stakeDeposit} placeholder='0'
                onChange={(e) => {setStakeStep(1); setStakeDeposit(e.target.value)}} />
              <br/>
              <p>Your current balance is <strong>{balance}</strong></p>
              <Button size='large' disabled={!wallet.connected} className='ApproveButton Button Dark' type='ghost'>
                Approve</Button>
            </Card>
          </div>
        </Col>
      </> :
      <Col span={12} className='Cards'>
        <Card className='Card Dark' title={assetTitleModal} bordered={false}
          extra={<a href='/#/stake' className='CardLink' onClick={() => setStakeCard('stake')}>Stake</a>}>
        </Card>
      </Col>
      }
      <Col span={6}></Col>
    </Row>
  );

  const daoView = (
    <Row>
      <Col span={2}></Col>
      <Col span={20} className='Cards'>
        <div className='site-card-border-less-wrapper'>
          <Card className='Card Dark' title='Dao' bordered={false}
            extra={<a href='/#/dao' className='CardLink' onClick={(e) => {}}>Create Proposal</a>}>
            <List itemLayout='horizontal' dataSource={daoProposals}
              renderItem={item => (
                <List.Item><List.Item.Meta title={item.title} description={item.description} />{item.icon}</List.Item>
              )}/>
          </Card>
        </div>
      </Col>
      <Col span={2}></Col>
    </Row>
  );

  useEffect(() => {
    getProviderCallback().then(function(provider) {
      if (wallet.connected && !balance) {
        try {
          provider.connection.getBalance(wallet.publicKey).then(function(result) {
            setBalance(result / LAMPORTS_PER_SOL);
          });
        } catch (e) {
          networkErrorMessage();
        }
      }

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

    if (window.location.href.split('#/').length === 2 && routes.indexOf(window.location.href.split('#/')[1]) >= 0) {
      setMenu(window.location.href.split('#/')[1]);
    } else {
      window.location.href = '/#/' + routes[0];
    }

    if (currentExchange === undefined) {
      // First exchange is always XV01
      setCurrentExchange(accounts.exchanges[0]);
    }

    getFactoryDataCallback();
    getDashboardCallback();
  }, [wallet.connected, wallet.publicKey, blockHeightInterval, getProviderCallback, balance, setMenu, getFactoryDataCallback,
    getDashboardCallback, countdownInterval, currentExchange, setCurrentExchange]);

  return (
    <Layout className='App Dark'>
      { showBanner ?
      <Alert type='info' className='Dark Alert' closable banner
        message='You are currently using an unaudited piece of software. Use at your own risk.' /> : null
      }
      <Header className='Header Dark'>
        <Row>
          <Col span={5}>
            <div className='Logo Dark'>
              <strong onClick={() => window.open(githubUrl, '_blank')}>{name}.finance</strong>
            </div>
          </Col>
          <Col span={14} className='ColCentered'>
            <Menu className='Menu Dark' onClick={(e) => {setMenu(e.key); window.location.href = '/#/' + e.key}} selectedKeys={[menu]}
              mode='horizontal'>
              <Menu.Item key='dashboard'>Dashboard</Menu.Item>
              <Menu.Item key='trade'>Trade</Menu.Item>
              <Menu.Item key='pool'>Pool</Menu.Item>
              <Menu.Item key='stake'>Stake</Menu.Item>
              <Menu.Item key='dao'>DAO</Menu.Item>
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
              <code className='SolCount'>{balance} SOL</code>
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
            { menu === 'dashboard' ? dashboardView : null }
            { menu === 'trade' ? tradeView : null }
            { menu === 'pool' ? poolView : null }
            { menu === 'stake' ? stakeView : null }
            { menu === 'dao' ? daoView : null }
          </div>
        </Content>
      </Layout>
      <Footer className='Footer'><code className='BlockHeight'><small>• {blockHeight}</small></code></Footer>
      <Modal title='Assets' footer={null} visible={isTradeAssetModalVisible} onCancel={() => {setIsTradeAssetModalVisible(false)}}>
        <List itemLayout='horizontal' dataSource={tradeAssets} forceRender={true}
          renderItem={asset => (
            <List.Item className='Asset ListItem'>
              <List.Item.Meta title={asset} onClick={() => {setTradeAsset(asset); getTrade(asset); setIsTradeAssetModalVisible(false)}}/>
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
