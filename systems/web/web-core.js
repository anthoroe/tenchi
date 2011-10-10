var Hook    = require('hook.io').Hook,
    util    = require('util'),
    io      = require("socket.io"),
    express = require("express"),
    Logger  = require("../shared/logger").Logger;
    
var WebCore = exports.WebCore = function(options) {
  var self   = this,
      opts   = options,
      web    = null,
      logger = new Logger();

  Hook.call(this, options);
  
  function start() {
    web = express.createServer();
    web.configure(function() {
    	web.use(express.static(__dirname + '/public'));
    	web.set('view engine', 'jade');
    	web.set('views', __dirname +'/views');
    });

    web.get('/', function(req, res) {
    	res.render('index');
    });
    web.listen(opts.port);
    
    // init socket.io
    io.listen(web);
    
    logger.log('info', 'Web server started on port ', opts.port);
  }
  
  this.on('hook::ready', function() {
    start();
  });

}

util.inherits(WebCore, Hook);
