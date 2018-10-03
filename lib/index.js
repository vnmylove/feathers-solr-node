const queryParser = require("./utils/queryParser");
const solrClient = require("./solr-client/solr");
const errors = require("feathers-errors");
const util = require("util");
const _ = require("./utils/util");

class Service {
  constructor(options) {
    this.setSolrConifg(options);
    this.solrClient = solrClient.createClient(this.getSolrConfig());
    this.basicAuth(options);
    this.queryParser = new queryParser();
  }

  basicAuth(options) {
    if (options.username && options.password) {
      this.solrClient.basicAuth(options.username, options.password);
    }
  }

  setSolrConifg(options) {
    this.solrConfig = {
      host: options.host || "172.0.0.1",
      port: options.port || "8983",
      path: options.path || "/solr",
      adminPath: options.adminPath || "/solr",
      core: options.core || "gettingstarted",
      get_max_request_entity_size: 1
    };
  }

  getSolrConfig() {
    return this.solrConfig;
  }

  getSolrClient(config) {
    if (config) {
      solrClient.createClient(config);
    }
    return this.solrClient;
  }

  find(params) {
    let query = this.queryParser.parseQuery(params.query);
    //console.log("this.queryParser", query);
    return new Promise((resolve, reject) => {
      this.solrClient.search(query, (err, res) => {
        if (err) {
          return reject(new errors.BadRequest(err.message));
        }
        return resolve(this.buildResult(query, res));
      });
    });
  }

  buildResult(query, res) {
    let response = {
      total: _.get(res, "response.numFound") || 0,
      limit: parseInt(query.limit),
      skip: parseInt(query.offset),
      data: _.get(res, "response.docs") || []
    };

    if (res.facets) {
      response.facet = res.facets;
    }

    if (res.highlighting) {
      response.highlighting = res.highlighting;
    }

    if (res.nextCursorMark) {
      response.nextCursorMark = res.nextCursorMark;
    }
    return response;
  }
}

module.exports = Service;
