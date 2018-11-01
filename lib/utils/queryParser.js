const _ = require('./util');
const errors = require('@feathersjs/errors');
class QueryParser {
  constructor(options) {
    this.mapKey = {
      $select: 'fields',
      $search: 'query',
      $limit: 'limit',
      $skip: 'offset',
      $sort: 'sort',
      $facet: 'facet',
      $params: 'params'
      //$qf: "qf"
      //'$or':'filter'
    };
    this.METHODS = ['$or'];
    this.setDefaultQuery(options);
  }

  setDefaultQuery(options) {
    this.defaultQuery = {
      query: '*:*', // TODO:  score
      //filter: [],
      // sort: '',
      fields: _.get(options, 'query.$select') || '*',
      limit:
        _.get(options, 'paginate.default') ||
        _.get(options, 'paginate.max') ||
        10,
      offset: 0
    };
    this.rowsMax = _.get(options, 'paginate.max');
  }

  getDefaultQuery() {
    return this.defaultQuery;
  }

  parseQuery(query) {
    let queryObj = Object.assign({}, this.getDefaultQuery());
    queryObj.filter = [];
    Object.keys(query).every((item) => {
      if (this.mapKey[item]) {
        let value = this[item](item, query[item]);
        queryObj[this.mapKey[item]] = value;
      } else {
        let $filter = this.filterBuilder(item, query[item]);
        if($filter) {
          queryObj.filter.push(...$filter);
        }
        else {
          queryObj =  new errors.BadRequest(`undefined field ${item}`);
          return false; 
        }
      }
    });
    return queryObj;
  }

  filterBuilder(item, param){
    if (item === '$or') {
      let value = this[item](item, param);
      return [value];
    }
    if (item[0] === '$') {
      return false;
    }
    return this.filter(item, param);
  }

  filter(field, param) {
    let $filter = [];
    if (_.isObject(param)) {
      Object.keys(param).forEach(f => {
        if (f[0] === '$' && typeof this[f] !== 'undefined') {
          let condition = this[f](field, param[f]);
          $filter.push(condition);
        }
      });
    } else if (Array.isArray(param)) {
      if (Array.isArray(param)) {
        param = '(' + param.join(' OR ') + ')';
      }
      $filter.push(field + ':' + param);
    } else {
      $filter.push(field + ':' + param);
    }
    return $filter;
  }

  $search(field, param) {
    return param;
  }

  $limit(field, param) {
    return parseInt(param) > this.rowsMax ? 
      this.rowsMax : param; 
  }

  $skip(field, param) {
    return param;
  }

  $sort(field, param) {
    let order = [];
    Object.keys(param).forEach(name => {
      order.push(name + (parseInt(param[name]) === 1 ? ' asc' : ' desc'));
    });
    return order.join(',');
  }

  $select(field, param) {
    if (Array.isArray(param)) {
      param = param.join(',');
    }
    return param;
  }

  $in(field, param) {
    if (Array.isArray(param)) {
      param = param.join('" OR "');
    }
    return field + ':("' + param + '")';
  }

  $nin(field, param) {
    if (Array.isArray(param)) {
      param = param.join('" OR "');
    }
    return '!' + field + ':("' + param + '")';
  }

  $between(field, param) {
    if (Array.isArray(param)) {
      param = param.join('" TO "');
    }
    return field + ':["' + param + '"]';
  }

  $lt(field, param) {
    return field + ':[* TO ' + param + '}';
  }

  $lte(field, param) {
    return field + ':[* TO ' + param + ']';
  }

  $gt(field, param) {
    return field + ':{' + param + ' TO *]';
  }

  $gte(field, param) {
    return field + ':[' + param + ' TO *]';
  }

  $ne(field, param) {
    if (Array.isArray(param)) {
      param = param.join('" OR "');
    }
    return '!' + field + ':"' + param + '"';
  }

  $or(field, param) {
    //let filter = this.query.filter;
    var $filter = [];
    if (Array.isArray(param)) {
      param.forEach((item) => {
        var f = Object.keys(item)[0];
        if (f[0] === '$' && typeof this[f] !== 'undefined') {
          let condition = this[f](f, item[f]);
          $filter.push(condition);
        } else {
          $filter.push(...this.filter(f, item[f]));
        }
      });
    } else {
      Object.keys(param).forEach((item) => {
        if (item[0] === '$' && typeof param[item] !== 'undefined') {
          let condition = this[item](item, param[item]);
          $filter.push(condition);
        } else {
          $filter.push(...this.filter(item, param[item]));
        }
      });
    }

    if ($filter.length > 0) {
      return '(' + $filter.join(' OR ') + ')';
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

  parseDelete(id, params) {
    if(id === '*' || id === '*:*'){
      return { delete: { query: '*:*' } };
    }else if(id){
      return { delete: {id: id} };
    }else if (_.isObject(params)) {
      let query = [];
      Object.keys(params).forEach((field) => {
        let filter = this.filterBuilder(field, params[field]);
        query.push(...filter);
      });
      return { delete: { query: query.join(' AND ') } };
    }
    return { delete: { query: '*:*' } };
  }
}

module.exports = QueryParser; 