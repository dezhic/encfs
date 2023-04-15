var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/file-list');

router.get('/metadata');

router.get('/content');

router.post('/upload');

router.post('/rename');

module.exports = router;
