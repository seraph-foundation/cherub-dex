import { Alert, Button, Card, Col, Dropdown, Input, Layout, List, Menu, Radio, Row, Select, Slider, Steps, Typography, message } from 'antd';
import { SettingOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Program, Provider, web3 } from '@project-serum/anchor';
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

const { Content, Footer, Header } = Layout;
const { Option } = Select;
const { Step } = Steps;
const { Title } = Typography;
const { SystemProgram, Keypair } = web3;

const factoryPublicKey = new PublicKey('FyuPaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');

const wallets = [getPhantomWallet()]
const baseAccount = Keypair.generate();
const opts = { preflightCommitment: 'processed' };
const network = 'http://127.0.0.1:8899';  // clusterApiUrl('testnet');
const name = 'xv01';
const marketCap = '130,000';
const price = '33';
const circulatingSupply = '1000122 / 1239332';
const currentIndex = '18.7 ' + name.toUpperCase();
const routes = ['dashboard', 'trade', 'stake', 'govern'];

const stakeOptions = (
  <Select defaultValue={name.toUpperCase()} className='select-before'>
    <Option value={name.toUpperCase()}>{name.toUpperCase()}</Option>
  </Select>
);

const tradeAssetOptions = (
  <Select defaultValue='BTC' className='select-before'>
    <Option value='SOL'>SOL</Option>
    <Option value='BTC'>BTC</Option>
    <Option value='ETH'>ETH</Option>
  </Select>
);

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

function App() {
  const [menu, setMenu] = useState('');
  const [stakeStep, setStakeStep] = useState(0);
  const [stakeDeposit, setStakeDeposit] = useState(0);
  const [stakeCard, setStakeCard] = useState('stake');
  const [tradeStep, setTradeStep] = useState(0);
  const [tradeDirection, setTradeDirection] = useState('long');
  const [tradeAmount, setTradeAmount] = useState(0);
  const [tradeCard, setTradeCard] = useState('trade');
  const [leverage, setLeverage] = useState(1);
  const [balance, setBalance] = useState(0);
  const [blockHeight, setBlockHeight] = useState(0);
  const [blockHeightInterval, setBlockHeightInterval] = useState(false);

  const wallet = useWallet()

  const getProviderCallback = useCallback(getProvider, [getProvider]);

  const settingsMenu = (
    <Menu>
      <Menu.Item key='github' onClick={onLearnMoreClick}>
        GitHub
      </Menu.Item>
      <Menu.Item key='discord'>
        Discord
      </Menu.Item>
    </Menu>
  );

  async function getProvider() {
    const connection = new Connection(network, opts.preflightCommitment);
    return new Provider(connection, wallet, opts.preflightCommitment);
  }

  async function fetchExchangeCount() {
    const provider = await getProviderCallback();
    const program = new Program(factoryIdl, new PublicKey(factoryIdl.metadata.address), provider);
    try {
      const account = await program.account.factoryData.fetch(factoryPublicKey);
      console.log('account: ', account);
    } catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  const fetchExchangeCountCallback = useCallback(fetchExchangeCount, [getProviderCallback]);

  async function initialize() {
    const provider = await getProvider();
    const program = new Program(exchangeIdl, new PublicKey(exchangeIdl.metadata.address), provider);
    try {
      await program.rpc.initialize('Hello World', {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });

      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      console.log('account: ', account);
    } catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  async function handleMenuClick(e) {
    window.location.href = '/#/' + e.key;
    setMenu(e.key);
  }

  async function onManageLiquidity() {
    setStakeCard('liquidity');
  }

  async function onStake() {
    setStakeCard('stake');
  }

  async function onTrade() {
    setTradeCard('trade');
  }

  async function onManagePositions() {
    setTradeCard('positions');
  }

  async function onCreateProposal() {

  }

  async function onConnectWalletClick(e) {
    document.getElementsByClassName('WalletMultiButton')[0].click();
  }

  async function onLearnMoreClick(e) {
    window.open('https://www.github.com/xv01-finance', '_blank');
  }

  async function onTradeDirectionChange(e) {
    setTradeDirection(e.target.value);
  }

  async function onStakeDepositChange(e) {
    setStakeStep(1);
    setStakeDeposit(e.target.value);
  }

  async function onTradeAmountChange(e) {
    setTradeStep(1);
    setTradeAmount(e.target.value);
  }

  async function onAfterLeverageChange(e) {
    setLeverage(e);
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

    //fetchExchangeCountCallback();
  }, [wallet.connected, wallet.publicKey, blockHeightInterval, getProviderCallback, balance, setMenu, fetchExchangeCountCallback]);

  return (
    <Layout className='App Dark'>
      <Alert type='warning' className='Dark Alert' closable
        message='You are currently using an unaudited piece of software. Use at your own risk.' banner/>
      <Header className='Header Dark'>
        <Row>
          <Col span={5}>
            <div className='Logo Dark'><strong onClick={onLearnMoreClick}>{name}.fi</strong></div>
          </Col>
          <Col span={14} style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center'}}>
            <Menu className='Menu Dark' onClick={handleMenuClick} selectedKeys={[menu]} mode='horizontal'>
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
              <Button className='ConnectWalletButton' onClick={onConnectWalletClick} type='link'>Connect Wallet</Button>
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
            { !wallet.connected ? (
              <>
                <Row>
                  <Col span={12}>
                    <Button className='ConnectWallet' onClick={onConnectWalletClick} type='primary' size='large'>Connect Wallet</Button>
                  </Col>
                  <Col span={12}>
                    <Button className='LearnMore Dark' onClick={onLearnMoreClick} ghost size='large'>Learn More</Button>
                  </Col>
                </Row>
              </>
            ) : <Title className='Title Dark Balance' level={2}>Balance: {balance} SOL</Title> }
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
              <Row>
                <Col span={6}></Col>
                { tradeCard === 'trade' ?
                <>
                  <Col span={8} className='Cards'>
                    <div className='site-card-border-less-wrapper'>
                      <Card title='Trade' className='Card Dark' bordered={false} extra={<a href='/#'
                          className='CardLink' onClick={onManagePositions}>Manage Positions</a>}>
                        <p><strong>Amount</strong></p>
                        <Input className='TradeInput Input Dark' addonBefore={tradeAssetOptions} onChange={onTradeAmountChange}
                          value={tradeAmount} />
                        <br/>
                        <p>Your current balance is <strong>{balance}</strong></p>
                        <p><strong>Collateral</strong></p>
                        <Input className='TradeInput Input Dark' addonBefore={tradeAssetOptions} defaultValue='0' />
                        <br/>
                        <br/>
                        <Radio.Group options={tradeOptions} onChange={onTradeDirectionChange} className='RadioGroup Dark'
                          optionType='button' buttonStyle='solid' value={tradeDirection} />
                        <br/>
                        <br/>
                        <p><strong>{ leverage }x Leverage</strong></p>
                        <Slider defaultValue={1} min={1} onAfterChange={onAfterLeverageChange} />
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
                      <Step key='set' title='Set Amount'
                        description=<div>Your order amount of <span className='Currency'>${tradeAmount}.00</span></div>/>
                      <Step key='collateral' title='Collateral' description='Leverage determines the required amount'/>
                      <Step key='order' title='Place Order' description='Instantly filled'/>
                    </Steps>
                  </Col>
                </> :
                <Col span={12} className='Cards'>
                  <div className='site-card-border-less-wrapper'>
                    <Card title='Manage Positions' className='Card Dark' bordered={false} extra={<a href='/#'
                        className='CardLink' onClick={onTrade}>Trade</a>}>
                    </Card>
                  </div>
                </Col>
                }
                <Col span={6}></Col>
              </Row>
            ) : '' }
            { menu === 'stake' ? (
              <Row>
                <Col span={6}></Col>
                { stakeCard === 'stake' ?
                <>
                  <Col span={4}>
                    <Steps direction='vertical' current={stakeStep}>
                      <Step key='set' title='Set Amount'
                        description=<div>
                          Your deposit of <span className='Currency'>{stakeDeposit}.00 {name.toUpperCase()}</span> is
                          set to earn <span className='Currency'>12% APY</span></div> />
                      <Step key='review' title='Review' description='Your deposit will earn 12% APY and you will receive 12 C tokens' />
                      <Step key='deposit' title='Deposit' description='Your deposit will be locked for 5 days' />
                    </Steps>
                  </Col>
                  <Col span={1}></Col>
                  <Col span={8} className='Cards'>
                    <div className='site-card-border-less-wrapper'>
                      <Card className='Card Dark' title='Stake' bordered={false}
                        extra={<a href='/#' className='CardLink' onClick={onManageLiquidity}>Manage Liquidity</a>}>
                        <Input className='StakeInput Input Dark' addonBefore={stakeOptions} onChange={onStakeDepositChange}
                          value={stakeDeposit} />
                        <br/>
                        <p>Your current balance is <strong>{balance}</strong></p>
                        <Button size='large' disabled={!wallet.connected} className='ApproveButton Button Dark' type='ghost'>
                          Approve</Button>
                      </Card>
                    </div>
                  </Col>
                </> :
                <Col span={12} className='Cards'>
                  <Card className='Card Dark' title='Manage Liquidity' bordered={false}
                    extra={<a href='/#' className='CardLink' onClick={onStake}>Stake</a>}>
                    <Input className='StakeInput Input Dark' addonBefore={stakeOptions} onChange={onStakeDepositChange}
                      value={stakeDeposit} />
                    <br/>
                    <p>Your current balance is <strong>{balance}</strong></p>
                    <Button size='large' disabled={!wallet.connected} className='ApproveButton Button Dark' type='ghost'>Approve
                    </Button>
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
                      extra={<a href='/#' className='CardLink' onClick={onCreateProposal}>Create Proposal</a>}>
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
      <Footer className='Footer'><code className='CurrentBlock'><small>• {blockHeight}</small></code></Footer>
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
