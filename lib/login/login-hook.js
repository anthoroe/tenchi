#!/usr/bin/env node

var Hook    = require('hook.io').Hook,
    util    = require('util'),
    io      = require("socket.io"),
    Login   = require('./lib/login').Login,
    Logger  = require("../shared/logger").Logger;
    
var LoginHook = exports.LoginHook = function(options) {
  var self         = this,
      opts         = options,
      connections  = {},
      login_server = null,
      login_system = null, 
      logger       = new Logger();

  Hook.call(this, options);
  
  function connection(socket) {
    logger.log('info', 'Client connection: ' + socket.id);
    connections[socket.id] = socket;
  }

  function disconnect(socket) {
    delete connections[socket.id];
    logger.log('info', 'Client disconnected: ' + socket.id);
  }
  
  function start() {
    login_server = io.listen(opts.port);
    login_server.set('log level', 1);

    login_server.sockets.on('connection', function(socket) {
      connection(socket);
      socket.on('login', function(message) {
        login_system.emit('login', socket, message);
      });
      socket.on('logout', function() {
        login_system.emit('logout', socket);
      });
      socket.on('disconnect', function() {
        disconnect(socket);
      });
    });
    
    login_system = new Login();
    login_system.init(self);
    
    logger.log('info', 'Login server started on port ' + opts.port);
  }
  
  this.on('user::logout', function(socket) {
    socket.clients[socket.id].onDisconnect();
  });
  
  this.on('hook::ready', function() {
    start();
  });

}

util.inherits(LoginHook, Hook);
