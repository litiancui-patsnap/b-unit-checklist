const cloud = require('wx-server-sdk');
const { handleEvent } = require('./lib.js');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event) => handleEvent(event || {}, process.env);
