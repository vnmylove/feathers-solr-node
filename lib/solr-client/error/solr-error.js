/**
 * Module dependencies
 */

var HTTPError = require("httperror"),
  util = require("util");

/**
 * Expose `SolrError`
 */

module.exports = SolrError;

/**
 * Create a new `SolrError`
 * @constructor
 *
 * @return {SolrError}
 * @api private
 */

function SolrError(req, res, htmlMessage) {
  var message = "";
  var data = null;
  if (htmlMessage) {
    try {
      data = JSON.parse(htmlMessage);
      if (data.error && data.error.msg) {
        message = data.error.msg;
      }
    } catch (e) {
      var matches = htmlMessage.match(/<p>([\s\S]+)<\/p>/);
      message = decode((matches || ["", htmlMessage])[1].trim());
    }
  }
  //console.log("moa : ", message);
  HTTPError.call(this, req, res, message);
  Error.captureStackTrace(this, arguments.callee);
  this.statusCode = res.statusCode;
  if (message) {
    this.message = message;
  } else {
    this.message = res.statusMessage;
  }
  this.name = "SolrError";
}

util.inherits(SolrError, HTTPError);

/**
 * Decode few HTML entities: &<>'"
 *
 * @param {String} str -
 *
 * @return {String}
 * @api private
 */
function decode(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/gm, "<")
    .replace(/&gt;/gm, ">")
    .replace(/&apos;/gm, "'")
    .replace(/&quot;/gm, '"');
}
