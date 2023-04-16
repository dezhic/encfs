var express = require('express');
var controller = require('./controller');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/list', controller.list);

router.get('/metadata', controller.getMetadata);

router.get('/content', controller.getContent);

router.post('/upload', controller.upload);

router.post('/delete', controller.delete);

module.exports = router;
