import 'antd/dist/antd.css';
import './App.css';

import { Button, Card, Col, Layout, Menu, Row, Typography } from 'antd';
import { Program, Provider, web3 } from '@project-serum/anchor';
import { useState } from 'react';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { Connection, PublicKey } from '@solana/web3.js';

import idl from './idl.json';

const { Header, Footer, Content } = Layout;
const { Title } = Typography;
const { SystemProgram, Keypair } = web3;

const wallets = [getPhantomWallet()]
const baseAccount = Keypair.generate();
const opts = { preflightCommitment: "processed" };
const programID = new PublicKey(idl.metadata.address);

function App() {
  const [menu, setMenu] = useState('swap');
  const wallet = useWallet()

  async function getProvider() {
    // Create the provider and return it to the caller network set to local network for now
    const network = "http://127.0.0.1:8899";
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(connection, wallet, opts.preflightCommitment);
    console.log('provider', provider);
    return provider;
  }

  async function initialize() {
    const provider = await getProvider();
    // Create the program interface combining the idl, program ID, and provider
    const program = new Program(idl, programID, provider);
    try {
      // Interact with the program via rpc
      await program.rpc.initialize("Hello World", {
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
      console.log("Transaction error: ", err);
    }
  }

  async function handleMenuClick(e) {
    setMenu(e.key);
  };

  async function onConnectWalletClick(e) {
    document.getElementsByClassName('WalletMultiButton')[0].click();
  };

  return (
    <Layout className="App">
      <Header className="Header">
        <Row>
          <Col span={3}>
            <div className="logo"><strong>xv01.finance</strong></div>
          </Col>
          <Col span={13}>
            <Menu className="Menu" onClick={handleMenuClick} selectedKeys={[menu]} mode="horizontal">
              <Menu.Item key="swap">Swap</Menu.Item>
              <Menu.Item key="pool">Pool</Menu.Item>
              <Menu.Item key="charts">Charts</Menu.Item>
            </Menu>
          </Col>
          <Col span={8} className="ConnectWalletHeader">
            { !wallet.connected ? (
              <>
                <WalletMultiButton className="WalletMultiButton" />
                <Button onClick={onConnectWalletClick} type="link">Connect Wallet</Button>
              </>) :
              <div className="Connected">
                <code>
                  { wallet.publicKey.toString().substr(0, 4) }...{ wallet.publicKey.toString().substr(-4) }
                </code>
              </div>
            }
          </Col>
        </Row>
      </Header>
      <Content>
        <div>
          <br/>
          <br/>
          { !wallet.connected ? (
            <>
              <Title>Perpetual futures and yield-based XV01 pooling protocol</Title>
              <Row>
                <Col span={12}>
                  <Button className="ConnectWallet" type="primary" size="large">Connect Wallet</Button>
                </Col>
                <Col span={12}>
                  <Button className="LearnMore" ghost size="large">Learn More</Button>
                </Col>
              </Row>
            </>
          ) : <Title level={2}>Balance: 0 SOL</Title> }
          <br/>
          <br/>
          <Row>
            <Col span={6}></Col>
            <Col span={12} className="Cards">
              { menu === "swap" ? (
                <div className="site-card-border-less-wrapper">
                  <Card title="Swap" bordered={false}>
                    <p>Card content</p>
                  </Card>
                </div>
              ) : "" }
              { menu === "pool" ? (
                <div className="site-card-border-less-wrapper">
                  <Card title="Pool" bordered={false}>
                    <p>Card content</p>
                  </Card>
                </div>
              ) : "" }
              { menu === "charts" ? (
                <div className="site-card-border-less-wrapper">
                  <Card title="Charts" bordered={false}>
                    <p>Card content</p>
                  </Card>
                </div>
              ) : "" }
            </Col>
            <Col span={6}></Col>
          </Row>
        </div>
      </Content>
      <Footer><code className="CurrentBlock"><small>97,826,670</small></code></Footer>
    </Layout>
  );
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint="http://127.0.0.1:8899">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider;
