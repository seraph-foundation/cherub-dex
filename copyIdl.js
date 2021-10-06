const fs = require('fs');

const exchangeIdl = require('./target/idl/exchange.json');
const factoryIdl = require('./target/idl/factory.json');
const pythIdl = require('./target/idl/pyth.json');

fs.writeFileSync('./app/src/factory.json', JSON.stringify(factoryIdl));
fs.writeFileSync('./app/src/exchange.json', JSON.stringify(exchangeIdl));
fs.writeFileSync('./app/src/pyth.json', JSON.stringify(pythIdl));
