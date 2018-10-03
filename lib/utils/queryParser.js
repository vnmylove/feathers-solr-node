var _ = require("./util");

class QueryParser {
  constructor(options) {
    this.mapKey = {
      $select: "fields",
      $search: "query",
      $limit: "limit",
      $skip: "offset",
      $sort: "sort",
      $facet: "facet",
      $params: "params"
      //$qf: "qf"
      //'$or':'filter'
    };
    this.METHODS = ["$or"];
    this.setDefaultQuery(options);
  }

  setDefaultQuery(options) {
    this.defaultQuery = {
      query: "*:*", // TODO:  score
      //filter: [],
      // sort: '',
      fields: _.get(options, "query.$select") || "*",
      limit:
        _.get(options, "paginate.default") ||
        _.get(options, "paginate.max") ||
        10,
      offset: 0
    };
  }

  getDefaultQuery() {
    return this.defaultQuery;
  }

  parseQuery(query) {
    let queryObj = Object.assign({}, this.getDefaultQuery());
    queryObj.filter = [];
    Object.keys(query).forEach((item, index) => {
      if (this.mapKey[item]) {
        let value = this[item](item, query[item]);
        queryObj[this.mapKey[item]] = value;
      } else if (item === "$or") {
        let value = this[item](item, query[item]);
        queryObj.filter.push(value);
      }
      if (item[0] === "$") {
      } else {
        let $filter = this.filter(item, query[item]);
        queryObj.filter.push(...$filter);
      }
    });
    return queryObj;
  }

  filter(field, param) {
    let $filter = [];
    if (_.isObject(param)) {
      Object.keys(param).forEach(f => {
        if (f[0] === "$" && typeof this[f] !== "undefined") {
          let condition = this[f](field, param[f]);
          $filter.push(condition);
        }
      });
    } else if (Array.isArray(param)) {
      if (Array.isArray(param)) {
        param = "(" + param.join(" OR ") + ")";
      }
      $filter.push(field + ":" + param);
    } else {
      $filter.push(field + ":" + param);
    }
    return $filter;
  }

  $search(field, param, queryObj) {
    return param;
  }

  $limit(field, param, queryObj) {
    return param;
  }

  $skip(field, param, queryObj) {
    return param;
  }

  $sort(field, param, queryObj) {
    let order = [];
    Object.keys(param).forEach(name => {
      order.push(name + (parseInt(param[name]) === 1 ? " asc" : " desc"));
    });
    return order.join(",");
  }

  $select(field, param, queryObj) {
    if (Array.isArray(param)) {
      param = param.join(",");
    }
    return param;
  }

  $in(field, param, queryObj) {
    if (Array.isArray(param)) {
      param = param.join('" OR "');
    }
    return field + ':("' + param + '")';
  }

  $nin(field, param, queryObj) {
    if (Array.isArray(param)) {
      param = param.join('" OR "');
    }
    return "!" + field + ':("' + param + '")';
  }

  $between(field, param, queryObj) {
    if (Array.isArray(param)) {
      param = param.join('" TO "');
    }
    return field + ':["' + param + '"]';
  }

  $lt(field, param, queryObj) {
    return field + ":[* TO " + param + "}";
  }

  $lte(field, param, queryObj) {
    return field + ":[* TO " + param + "]";
  }

  $gt(field, param) {
    return field + ":{" + param + " TO *]";
  }

  $gte(field, param) {
    return field + ":[" + param + " TO *]";
  }

  $ne(field, param) {
    if (Array.isArray(param)) {
      param = param.join('" OR "');
    }
    return "!" + field + ':"' + param + '"';
  }

  $or(field, param) {
    //let filter = this.query.filter;
    var $filter = [];
    if (Array.isArray(param)) {
      param.forEach((item, index) => {
        var f = Object.keys(item)[0];
        if (f[0] === "$" && typeof this[f] !== "undefined") {
          let condition = this[f](f, item[f]);
          $filter.push(condition);
        } else {
          $filter.push(...this.filter(f, item[f]));
        }
      });
    } else {
      Object.keys(param).forEach((item, index) => {
        if (item[0] === "$" && typeof Query[item] !== "undefined") {
          let condition = this[item](item, param[item]);
          $filter.push(condition);
        } else {
          $filter.push(...this.filter(item, param[item]));
        }
      });
    }

    if ($filter.length > 0) {
      return "(" + $filter.join(" OR ") + ")";
    }
    return null;
  }

  $qf(field, params) {
    return Object.assign({}, this.query.params || {}, {
      qf: params
    });
  }

  $facet(field, params) {
    return params;
  }

  $params(field, params) {
    //return Object.assign(this.query.params || {}, params);
    return params;
  }
}

module.exports = QueryParser;
