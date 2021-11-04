import 'antd/dist/antd.css'
import './App.css'

import { BookOutlined, GithubOutlined, LoginOutlined } from '@ant-design/icons'
import { Carousel, Col, Layout, Menu, Row, Typography  } from 'antd'

const { Content, Footer, Header } = Layout
const { Title } = Typography

function App() {
  const heroView = (
    <Row className='hero-view'>
      <Col xs={0} md={2}></Col>
      <Col xs={24} md={20}>
        <div>
          <div className='hero-content'>
            <Title className='hero-title'>Cherub Protocol</Title>
            <Title className='hero-description' level={3}>Inverse Perpetuals (3, 3) DAO</Title>
          </div>
        </div>
      </Col>
      <Col xs={0} md={2}></Col>
    </Row>
  )

  const carouselView = (
    <Carousel className='carousel-view' autoplay fade>
      <div>
        <Title className='carousel-title'>Build</Title>
        <p className='carousel-description'>Access or bond deep, protocol-owned liquidity</p>
      </div>
      <div>
        <Title className='carousel-title'>Trade</Title>
        <p className='carousel-description'>100x leverage and zero impermanent loss using virtual Automated Marketing Making</p>
      </div>
      <div>
        <Title className='carousel-title'>Invest</Title>
        <p className='carousel-description'>Stake CHRB to receive high-yield, rebased cryptodollars</p>
      </div>
    </Carousel>
  )

  function onMenuClick(e) {
    if (e.key === '0') {
      window.open('https://dev.cherub.so', '_blank')
    } else if (e.key === '1') {
      window.open('https://github.com/cherub-so/cherub-protocol', '_blank')
    } else if (e.key === '2') {
      window.open('https://app.cherub.so', '_blank')
    }
  }

  return (
    <Layout className='layout'>
      <Header>
        <Row>
          <Col span='6'>
            <img alt='logo' className='header-logo' src='logo.png'/>
          </Col>
          <Col span='6'></Col>
          <Col span='12'>
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
