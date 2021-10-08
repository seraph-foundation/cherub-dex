import {
  Alert, Button, Card, Col, Dropdown, Input, Layout, List, Modal, Menu, Radio, Row, Select, Slider, Steps, Typography, message
} from 'antd';
import { DownOutlined, SettingOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Program, Provider } from '@project-serum/anchor';
import { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';

import 'antd/dist/antd.css';
import './App.css';

import exchangeIdl from './exchange.json';
import factoryIdl from './factory.json';
import pythIdl from './pyth.json';

import accounts from './accounts-localnet.json';

const { Content, Footer, Header } = Layout;
const { Option } = Select;
const { Step } = Steps;
const { Title } = Typography;

const factoryPublicKey = new PublicKey(accounts.factory);
const exchangePublicKey = new PublicKey(accounts.exchange);
const pythPublicKey = new PublicKey(accounts.pyth);

const wallets = [getPhantomWallet()];
const opts = { preflightCommitment: 'processed' };
const network = window.location.origin === 'http://localhost:3000' ? 'http://127.0.0.1:8899' : clusterApiUrl('mainnet');
const name = 'xv01';
const marketCap = '130,000';
const price = '33.51';
const circulatingSupply = '1000122 / 1239332';
const currentIndex = '18.7 ' + name.toUpperCase();
const routes = ['dashboard', 'trade', 'stake', 'govern'];

const tradeOptions = [
  { label: 'Buy / Long', value: 'long' },
  { label: 'Sell / Short', value: 'short' },
];

const tvlData = {
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

const governProposals = [
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

const tradeAssets = ['SOL', 'BTC', 'XV01'];

const showBanner = false;

function App() {
  const [balance, setBalance] = useState(0);
  const [blockHeight, setBlockHeight] = useState(0);
  const [blockHeightInterval, setBlockHeightInterval] = useState(false);
  const [isTradeAssetModalVisible, setIsTradeAssetModalVisible] = useState(false);
  const [leverage, setLeverage] = useState(1);
  const [menu, setMenu] = useState('');
  const [stakeCard, setStakeCard] = useState('stake');
  const [stakeDeposit, setStakeDeposit] = useState();
  const [stakeStep, setStakeStep] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);
  const [tradeCard, setTradeCard] = useState('trade');
  const [tradeDirection, setTradeDirection] = useState('long');
  const [tradeQuantity, setTradeQuantity] = useState();
  const [tradeStep, setTradeStep] = useState(0);
  const [tradeAsset, setTradeAsset] = useState(tradeAssets[0]);

  const wallet = useWallet()

  const getProviderCallback = useCallback(getProvider, [getProvider]);
  const getFactoryDataCallback = useCallback(getFactoryData, [getProviderCallback]);

  const settingsMenu = (
    <Menu>
      <Menu.Item key='github' onClick={() => window.open('https://www.github.com/xv01-finance', '_blank')}>
        GitHub
      </Menu.Item>
      <Menu.Item key='discord'>
        Discord
      </Menu.Item>
    </Menu>
  );

  const assetTitleModal = (
    <Button className='AssetTitleModal' type='link' onClick={() => setIsTradeAssetModalVisible(true)}>
      {tradeAsset} <DownOutlined/>
    </Button>
  );

  const tradeStatsBar = (
    <Row className='TradeStatsBar'>
      <Col span={3}></Col>
      <Col span={3}>
        <p><small>Market</small></p>
        <Title level={4} className='Title Dark Green'>55,534.20</Title>
      </Col>
      <Col span={3}>
        <p><small>24H Change %</small></p>
        <Title level={4} className='Title Dark Green'>+2.67%</Title>
      </Col>
      <Col span={3}>
        <p><small>24H High</small></p>
        <Title level={4} className='Title Dark'>56,238.50</Title>
      </Col>
      <Col span={3}>
        <p><small>24H Low</small></p>
        <Title level={4} className='Title Dark'>53,384.50</Title>
      </Col>
      <Col span={3}>
        <p><small>24H Turnaround</small></p>
        <Title level={4} className='Title Dark'>64,848.57</Title>
      </Col>
      <Col span={3}>
        <p><small>Funding Rate / Countdown</small></p>
        <Title level={4} className='Title Dark'><span className='Yellow'>0.0135</span> / 04:26:40</Title>
      </Col>
      <Col span={3}></Col>
    </Row>
  );

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

  function networkErrorMessage() {
    message.info('Unable to connect to network');
  }

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

    if (window.location.href.split('#/').length === 2 && routes.indexOf(window.location.href.split('#/')[1]) >= 0) {
      setMenu(window.location.href.split('#/')[1]);
    } else {
      window.location.href = '/#/' + routes[0];
    }

    getFactoryDataCallback();
  }, [wallet.connected, wallet.publicKey, blockHeightInterval, getProviderCallback, balance, setMenu, getFactoryDataCallback]);

  return (
    <Layout className='App Dark'>
      { showBanner ?
      <Alert type='info' className='Dark Alert' closable
        message='You are currently using an unaudited piece of software. Use at your own risk.' banner/> : ''
      }
      <Header className='Header Dark'>
        <Row>
          <Col span={5}>
            <div className='Logo Dark'>
              <strong onClick={() => window.open('https://www.github.com/xv01-finance/xv01-protocol', '_blank')}>{name}.fi</strong>
            </div>
          </Col>
          <Col span={14} className='ColCentered'>
            <Menu className='Menu Dark' onClick={(e) => {setMenu(e.key); window.location.href = '/#/' + e.key}} selectedKeys={[menu]}
              mode='horizontal'>
              <Menu.Item key='dashboard'>Dashboard</Menu.Item>
              <Menu.Item key='trade'>Trade</Menu.Item>
              <Menu.Item key='stake'>Stake</Menu.Item>
              <Menu.Item key='govern'>Govern</Menu.Item>
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
            <Dropdown className='Dropdown' overlay={settingsMenu}><SettingOutlined/></Dropdown>
          </Col>
        </Row>
      </Header>
      <Layout className='Layout Dark'>
        <Content>
          <div>
            <br/>
            <br/>
            { menu === 'dashboard' ? (
              <Row>
                <Col span={2}></Col>
                <Col span={20} className='Cards'>
                  <div className='site-card-border-less-wrapper'>
                    <Card className='Card Dark' title='Dashboard' bordered={false}>
                      <Row>
                        <Col span={6}>
                          <p>Market Cap</p>
                          <Title level={3} className='Title Dark'>${marketCap}</Title>
                        </Col>
                        <Col span={6}>
                          <p>{name.toUpperCase()} Price</p>
                          <Title level={3} className='Title Dark'>${price}</Title>
                        </Col>
                        <Col span={6}>
                          <p>Circulating Supply</p>
                          <Title level={3} className='Title Dark'>{circulatingSupply}</Title>
                        </Col>
                        <Col span={6}>
                          <p>Current Index</p>
                          <Title level={3} className='Title Dark'>{currentIndex}</Title>
                        </Col>
                      </Row>
                      <Row>
                        <Col span={12}>
                          <p>Total Value Locked</p>
                          <Line height={100} data={tvlData} options={chartOptions}/>
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
            ) : '' }
            { menu === 'trade' ? (
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
                          <Input className='TradeInput Input Dark' value={tradeQuantity}
                            placeholder='0'
                            onChange={(e) => {setTradeQuantity(e.target.value); setTradeStep(1)}} />
                          <br/>
                          <p>Your current balance is <strong>{balance}</strong></p>
                          <Radio.Group options={tradeOptions} onChange={(e) => setTradeDirection(e.target.value)}
                            className='RadioGroup Dark' optionType='button' buttonStyle='solid' value={tradeDirection} />
                          <br/>
                          <br/>
                          <p><strong>{leverage}x Leverage</strong></p>
                          <Slider defaultValue={1} min={1} onAfterChange={(e) => {setLeverage(e); setTradeStep(2)}} />
                          <br/>
                          <Button size='large' disabled={!wallet.connected} className='TradeButton Button Dark' type='ghost'>
                            Approve
                          </Button>
                        </Card>
                      </div>
                    </Col>
                    <Col span={1}></Col>
                    <Col span={3}>
                      <Steps direction='vertical' current={tradeStep}>
                        <Step key='set' title='Quantity'
                          description=<div>Your order amount of <span className='Green'>{tradeQuantity} {tradeAsset}</span></div>/>
                        <Step key='collateral' title='Leverage' description='Leverage determines the required amount'/>
                        <Step key='order' title='Approve' description='Instantly filled'/>
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
            ) : '' }
            { menu === 'stake' ? (
              <Row>
                <Col span={6}></Col>
                { stakeCard === 'stake' ?
                <>
                  <Col span={4}>
                    <Steps direction='vertical' current={stakeStep}>
                      <Step key='set' title='Quantity'
                        description=<div>
                          Your deposit of <span className='Green'>{stakeDeposit} {name.toUpperCase()}</span> is
                          set to earn <span className='Green'>12% APY</span></div> />
                      <Step key='review' title='Review' description='Your deposit will earn 12% APY and you will receive 12 C tokens' />
                      <Step key='deposit' title='Approve' description='Your deposit will be locked for 5 days' />
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
            ) : '' }
            { menu === 'govern' ? (
              <Row>
                <Col span={2}></Col>
                <Col span={20} className='Cards'>
                  <div className='site-card-border-less-wrapper'>
                    <Card className='Card Dark' title='Govern' bordered={false}
                      extra={<a href='/#/govern' className='CardLink' onClick={(e) => console.log(e)}>Create Proposal</a>}>
                      <List
                        itemLayout='horizontal'
                        dataSource={governProposals}
                        renderItem={item => (
                          <List.Item>
                            <List.Item.Meta title={item.title} description={item.description} />
                            {item.icon}
                          </List.Item>
                        )}
                      />
                    </Card>
                  </div>
                </Col>
                <Col span={2}></Col>
              </Row>
            ) : '' }
          </div>
        </Content>
      </Layout>
      <Footer className='Footer'><code className='BlockHeight'><small>• {blockHeight}</small></code></Footer>
      <Modal title='Assets' footer={null}
        visible={isTradeAssetModalVisible} onCancel={() => {setIsTradeAssetModalVisible(false)}}>
        <List
          itemLayout='horizontal'
          dataSource={tradeAssets}
          renderItem={asset => (
            <List.Item>
              <List.Item.Meta title={asset} onClick={() => {setTradeAsset(asset); setIsTradeAssetModalVisible(false)}}/>
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
)

export default AppWithProvider;
