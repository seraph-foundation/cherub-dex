import 'antd/dist/antd.css';
import './App.css';
import {
  Alert, Button, Card, Col, Dropdown, Input, Layout, List, Menu, Radio, Row, Select, Slider, Steps, Typography, message
} from 'antd';
import { SettingOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Program, Provider, web3 } from '@project-serum/anchor';
import { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { Connection, PublicKey } from '@solana/web3.js';

import idl from './idl.json';

const { Content, Footer, Header } = Layout;
const { Option } = Select;
const { Step } = Steps;
const { Title } = Typography;
const { SystemProgram, Keypair } = web3;

const wallets = [getPhantomWallet()]
const baseAccount = Keypair.generate();
const opts = { preflightCommitment: 'processed' };
const programID = new PublicKey(idl.metadata.address);

const name = 'bicep';

const poolOptions = (
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

const lamportsPerSol = 10000000;
const network = 'http://127.0.0.1:8899';

function App() {
  const [menu, setMenu] = useState('dashboard');
  const [tradeStep, setTradeStep] = useState(0);
  const [poolStep, setPoolStep] = useState(0);
  const [poolDeposit, setPoolDeposit] = useState(0);
  const [tradeDirection, setTradeDirection] = useState('long');
  const [leverage, setLeverage] = useState(1);
  const [tradeAmount, setTradeAmount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [blockHeight, setBlockHeight] = useState(0);
  const [blockHeightInterval, setBlockHeightInterval] = useState(false);

  const wallet = useWallet()

  const getProviderCallback = useCallback(getProvider, [getProvider]);

  const showSteps = false;

  const marketCap = '130,000';
  const price = '33';
  const circulatingSupply = '1000122 / 1239332';
  const currentIndex = '18.7 ' + name.toUpperCase();

  const governanceProposals = [
    {
      title: 'Move SOL/COPE pool to SOL/MANGO',
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

  const settingsMenu = (
    <Menu onClick={handleSettingsClick}>
      <Menu.Item key='Light mode'>
        Dark mode
      </Menu.Item>
      <Menu.Item key='Dark mode'>
        Light mode
      </Menu.Item>
    </Menu>
  );

  async function getProvider() {
    const connection = new Connection(network, opts.preflightCommitment);
    return new Provider(connection, wallet, opts.preflightCommitment);
  }

  async function initialize() {
    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
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
    setMenu(e.key);
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

  async function onPoolDepositChange(e) {
    setPoolStep(1);
    setPoolDeposit(e.target.value);
  }

  async function onTradeAmountChange(e) {
    setTradeStep(1);
    setTradeAmount(e.target.value);
  }

  async function onAfterLeverageChange(e) {
    setLeverage(e);
  }

  function handleSettingsClick(e) {
    message.info(e.key);
  }

  function networkErrorMessage() {
    message.info('Unable to connect to network');
  }

  useEffect(() => {
    getProviderCallback().then(function(provider) {
      if (wallet.connected && !balance) {
        try {
          provider.connection.getBalance(wallet.publicKey).then(function(result) {
            setBalance(result / lamportsPerSol);
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
  }, [wallet.connected, wallet.publicKey, blockHeightInterval, getProviderCallback, balance]);

  return (
    <Layout className='App Dark'>
      <Alert type='warning' className='Dark Alert' closable
        message='You are currently using an unaudited piece of software. Use at your own risk.' banner/>
      <Header className='Header Dark'>
        <Row type='flex' style={{alignItems: 'center'}}>
          <Col span={6}>
            <div className='Logo Dark'><strong onClick={onLearnMoreClick}>{name}.fi</strong></div>
          </Col>
          <Col span={12} type='flex' style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center'}}>
            <Menu className='Menu Dark' onClick={handleMenuClick} selectedKeys={[menu]} mode='horizontal'>
              <Menu.Item key='dashboard'>Dashboard</Menu.Item>
              <Menu.Item key='trade'>Trade</Menu.Item>
              <Menu.Item key='pool'>Pool</Menu.Item>
              <Menu.Item key='governance'>Governance</Menu.Item>
            </Menu>
          </Col>
          <Col span={6} className='ConnectWalletHeader'>
            { !wallet.connected ?
            <>
              <WalletMultiButton className='WalletMultiButton'/>
              <Dropdown.Button className='ConnectWalletButton'
                icon={<SettingOutlined/>} onClick={onConnectWalletClick} type='link' overlay={settingsMenu}>
                Connect Wallet
              </Dropdown.Button>
            </> :
            <div className='Connected'>
              <code>{wallet.publicKey.toString().substr(0, 4)}...{wallet.publicKey.toString().substr(-4)}</code>
            </div>
            }
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
                { showSteps ? <>
                <Col span={4}>
                  <Steps direction='vertical' current={0}>
                    <Step key='trade' description='Long or short perpetual swaps' />
                    <Step key='pool' description='Use LP tokens to earn yield' />
                    <Step key='govern' description='Vote where LP resources are allocated' />
                  </Steps>
                </Col>
                <Col span={1}></Col> </> : ''
                }
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
                <Col span={8} className='Cards'>
                  <div className='site-card-border-less-wrapper'>
                    <Card title='Trade' className='Card Dark' bordered={false}>
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
                      <Button size='large' disabled={!wallet.connected} className='TradeButton Button Dark' type='ghost'>Approve</Button>
                    </Card>
                  </div>
                </Col>
                <Col span={1}></Col>
                <Col span={3}>
                  <Steps direction='vertical' current={tradeStep}>
                    <Step key='set' title='Set Amount'
                      description=<div>Your order amount of <span className="Currency">${tradeAmount}.00</span></div>/>
                    <Step key='collateral' title='Collateral' description='Leverage determines the required amount'/>
                    <Step key='order' title='Place Order' description='Instantly filled'/>
                  </Steps>
                </Col>
                <Col span={6}></Col>
              </Row>
            ) : '' }
            { menu === 'pool' ? (
              <Row>
                <Col span={6}></Col>
                <Col span={4}>
                  <Steps direction='vertical' current={poolStep}>
                    <Step key='set' title='Set Amount'
                      description=<div>Your deposit of <span className='Currency'>{poolDeposit}.00 {name.toUpperCase()}</span> is set to earn <span className='Currency'>12% APY</span></div> />
                    <Step key='review' title='Review' description='Your deposit will earn 12% APY and you will receive 12 C tokens' />
                    <Step key='deposit' title='Deposit' description='Your deposit will be locked for 5 days' />
                  </Steps>
                </Col>
                <Col span={1}></Col>
                <Col span={8} className='Cards'>
                  <div className='site-card-border-less-wrapper'>
                    <Card className='Card Dark' title='Pool' bordered={false}>
                      <Input className='PoolInput Input Dark' addonBefore={poolOptions} onChange={onPoolDepositChange}
                        value={poolDeposit} />
                      <br/>
                      <p>Your current balance is <strong>{balance}</strong></p>
                      <Button size='large' disabled={!wallet.connected} className='ApproveButton Button Dark' type='ghost'>Approve</Button>
                    </Card>
                  </div>
                </Col>
                <Col span={6}></Col>
              </Row>
            ) : '' }
            { menu === 'governance' ? (
              <Row>
                <Col span={2}></Col>
                <Col span={20} className='Cards'>
                  <div className='site-card-border-less-wrapper'>
                    <Card className='Card Dark' title='Governance' bordered={false}>
                      <List
                        itemLayout='horizontal'
                        dataSource={governanceProposals}
                        renderItem={item => (
                          <List.Item>
                            <List.Item.Meta
                              title={<a href='#'>{item.title}</a>}
                              description={item.description}
                            />
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
