const fs = require('fs');
const idl = require('./target/idl/exchange.json');

fs.writeFileSync('./app/src/idl.json', JSON.stringify(idl));
