#!/usr/bin/env node

var Hook   = require('hook.io').Hook,
    Logger = require('./shared/logger').Logger;

// tenchi system
var WebCore = require('./web/web-core').WebCore;
var webcore = new WebCore({ name: "tenchi-web", port: 8080 });

var WorldCore = require('./world/world-core').WorldCore;
var worldcore = new WorldCore({ name: "tenchi-world", port: 7000 });

var logger = new Logger();

var hook = new Hook({
  name: "tenchi-core",
  debug: true
});

hook.on('hook::ready', function() {
  logger.log('info', 'tenchi-core initialized...');

  // init web server
  webcore.start();
  
  // init game server
  worldcore.start();
});

hook.start();
