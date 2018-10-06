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
    this.queryParser = new queryParser(options);
    this.formatDataRow = options.dataRow || false;      
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

  setformatDataRow(formatDataRow){
    this.formatDataRow = formatDataRow;
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

  buildDataRow(item, formatDataRow) {
    var result = {};
    for (var key in formatDataRow) {
        var value = null;
        var field = formatDataRow[key];
        //console.log('buildDataRow :', key);
        if (field instanceof Array) {
          if (item[field[0]]){
            value = item[field[0]][field[1]];
          }
        }else  if (field instanceof Function) {
          value = field(item);
        }else if(field instanceof Object){
          value = this.buildDataRow(item,field);
        }
        else {
          value = item[field];
        } 
        if (value != 'undefined') {
            result[key] = value;
        }
    }
    return Object.keys(result).length>0 ? result : null ;
  };
  
  buildResult(query, res) {
    let response = {
      total: _.get(res, "response.numFound") || 0,
      limit: parseInt(query.limit),
      skip: parseInt(query.offset),
    };
    const data = _.get(res, "response.docs") || [];
    if(this.formatDataRow){
      let dataRows = []; 
      for(let i=0; i<data.length; i++){
        dataRows.push(this.buildDataRow(data[i], this.formatDataRow));
      }
      response.data = dataRows;
    }else {
      response.data = data;
    }
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
