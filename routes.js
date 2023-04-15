var express = require('express');
var controller = require('./controller');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/list', controller.list);

router.get('/metadata');

router.get('/content');

router.post('/upload', controller.upload);

router.post('/rename');

module.exports = router;
