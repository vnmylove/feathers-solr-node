# feathers-solr-node
> Solr Adapter for Feathersjs. Based on Solr-Client Adapter, so can also used as a Solr-client. see [here](https://github.com/lbdremy/solr-node-client)

## Installation
```
npm install feathers-solr-node --save
```

## Complete Example

```javascript
const feathers = require("feathers");
const rest = require("feathers-rest");
const hooks = require("feathers-hooks");
const bodyParser = require("body-parser");
const errorHandler = require("feathers-errors/handler");
const solr = require("../main");
const express = require("@feathersjs/express");
const logger = require("winston");

const Service = new solr({
  host: "127.0.0.1", // your solr host
  port: 8086,
  core: "gettingstarted", // core name or collection name
  username: "solr_user", // optional
  password: "sol_password", // optional
  paginate: {
    default: 10,
    max: 100
  }
});

const app = feathers()
  .configure(rest())
  .configure(hooks())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use("/solr", Service)
  .use(
    express.errorHandler({
      html: false,
      logger,
      json: (err, req, res, next) => {
        res.json({
          error: {
            message: err.message,
            code: err.code
          }
        });
      }
    })
  );

app.listen(3030);

console.log("Feathers app started on 127.0.0.1:3030");

```

