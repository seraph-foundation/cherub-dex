const { spawn } = require('child_process')
const { Connection, PublicKey } = require('@solana/web3.js')

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function main() {
  console.log('Running....')

  const connection = new Connection('http://localhost:8899')

  const dexProgramId = new PublicKey('Fy3KFXjKaA6irHp3g5YZ1pKL9a9JUwPvC32Yp4ny2epZ')
  const dexSubscriptionId = connection.onProgramAccountChange(dexProgramId, ({ accountId, accountInfo }) => {
    console.log('Program change', accountId.toString())
  })

  const logsSubscriptionId = connection.onLogs(dexProgramId, (res) => {
    console.log(res)
  })

  while (true) {
    console.log('Sleeping...')
    await sleep(5000)
  }
}

main()
