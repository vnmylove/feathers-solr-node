const queryParser = require('../lib/utils/queryParser');
var query = new queryParser({});
var filter = {
  a: 1,
  $or:[
    {b:2},
    {c:3,d:4,k:{$gte:10}},
    {e:{$lte:5}}
  ],
  f:{$lt:6}

};
let q = query.parseQuery(filter);
const util = require('util');

// eslint-disable-next-line no-console
console.log(util.inspect(q, {showHidden: false, depth: null}));
