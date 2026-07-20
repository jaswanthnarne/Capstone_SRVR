const app = require('../server');

module.exports = (req, res) => {
  if (req.headers && req.headers['x-matched-path']) {
    req.url = req.headers['x-matched-path'];
  }
  app(req, res);
};
