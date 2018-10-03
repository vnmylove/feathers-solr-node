const feathers = require("feathers");
const rest = require("feathers-rest");
const hooks = require("feathers-hooks");
const bodyParser = require("body-parser");
const errorHandler = require("feathers-errors/handler");
const solr = require("../main");
const express = require("@feathersjs/express");
const logger = require("winston");

const Service = new solr({
  host: "115.79.204.120",
  port: 8086,
  core: "topic_27009",
  username: "solr",
  password: "solradmin",
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
