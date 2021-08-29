const feathers = require('feathers');
const rest = require('feathers-rest');
const hooks = require('feathers-hooks');
const bodyParser = require('body-parser');
const solr = require('../main');
const express = require('@feathersjs/express');
const logger = require('winston');

const Service = new solr({
  host: 'localhost',
  port: 8089,
  core: 'topic_27009',
  username: 'solr',
  password: 'solradmin',
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
  .use('/solr', Service)
  .use(
    express.errorHandler({
      html: false,
      logger,
      json: (err, req, res) => {
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

// eslint-disable-next-line no-console
console.log('Feathers app started on 127.0.0.1:3030');
