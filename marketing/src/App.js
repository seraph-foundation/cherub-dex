import 'antd/dist/antd.css'
import './App.css'

import { BookOutlined, GithubOutlined, LoginOutlined } from '@ant-design/icons'
import { Carousel, Col, Layout, Menu, Row, Typography  } from 'antd'

const { Content, Footer, Header } = Layout
const { Title } = Typography

function App() {
  const heroView = (
    <div className='hero-view'>
      <div className='hero-content'>
        <Title className='hero-title'>Cherub</Title>
        <Title className='hero-description' level={3}>Inverse Perpetuals DAO (3, 3)</Title>
      </div>
    </div>
  )

  const carouselView = (
    <Carousel className='carousel-view' autoplay fade>
      <div>
        <Title className='carousel-title'>Trade</Title>
        <p className='carousel-description'>100x leverage and zero impermanent loss using virtual automated marketing making</p>
      </div>
      <div>
        <Title className='carousel-title'>Build</Title>
        <p className='carousel-description'>Access or bond deep, protocol-owned liquidity</p>
      </div>
      <div>
        <Title className='carousel-title'>Invest</Title>
        <p className='carousel-description'>Stake protocol tokens to receive high-yield, rebased cryptodollars</p>
      </div>
    </Carousel>
  )

  function onMenuClick(e) {
    if (e.key === '0') {
      window.open('https://dev.cherub.markets', '_blank')
    } else if (e.key === '1') {
      window.open('https://github.com/cherub-protocol/cherub-protocol', '_blank')
    } else if (e.key === '2') {
      window.open('https://app.cherub.markets', '_blank')
    }
  }

  return (
    <Layout className='layout'>
      <Header className='fixed-header'>
        <Row>
          <Col span={6}>
            <div className='logo'>
              <img alt='logo' className='header-logo' src='logo.png'/>
            </div>
          </Col>
          <Col span={10}>
          </Col>
          <Col span={8} style={{ paddingLeft: 35 }}>
            <Menu theme='dark' mode='horizontal' onClick={onMenuClick} className='header-menu' defaultSelectedKeys={[]} selectable={false}>
              <Menu.Item key='0'><BookOutlined/>&nbsp; Developers</Menu.Item>
              <Menu.Item key='1'><GithubOutlined/>&nbsp; GitHub</Menu.Item>
              <Menu.Item key='2'><LoginOutlined/>&nbsp; Launch App</Menu.Item>
            </Menu>
          </Col>
        </Row>
      </Header>
      <Content>
        {heroView}
        {carouselView}
      </Content>
      <Footer className='footer'>Cherub ©2021</Footer>
    </Layout>
  )
}

export default App
