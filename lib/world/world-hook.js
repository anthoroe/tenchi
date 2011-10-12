#!/usr/bin/env node

var Hook    = require('hook.io').Hook,
    util    = require('util'),
    io      = require("socket.io"),
    Logger  = require("../shared/logger").Logger,
    Loop    = require("./lib/loop").Loop,
    World   = require("./game/world").World;
    
var WorldHook = exports.WorldHook = function(options) {
  
  var self = this;
  Hook.call(this, options);
  
  var connections   = {},
      opts          = options,
      world         = null,
      update_tick   = 1,
      loop          = null,
      socket_server = null,
      logger        = new Logger();

  function connection(socket) {
    logger.log('info', 'Client connection: ' + socket.id);
    connections[socket.id] = socket;
    world.emit("on_connection", socket);
  }

  function disconnect(socket) {
    world.emit("on_disconnect", socket);
    delete connections[socket.id];
    logger.log('info', 'Client disconnected: ' + socket.id);
  }

  function on_tick(t, dt) {
    world.emit("on_update", t, dt);
  }

  function start() {
    // if the server isn't already bound to a port
    if (!socket_server) {
      socket_server = io.listen(opts.port);
      socket_server.set('log level', 1);

      socket_server.sockets.on('connection', function(socket) {
        connection(socket);
        socket.on('message', function(message) {
          world.emit('on_message', socket, message);
        });
        socket.on('disconnect', function() {
          disconnect(socket);
        });
      });
    }

    world = new World();
    world.build();

    loop  = new Loop();
    loop.on_tick = on_tick;

    logger.log('info', 'Starting game loop...');

    loop.start();
  }

  function stop(reason, callback) {
    var msg = reason || 'Server is shutting down.';
    
    for (var id in connections) {
      connections[id].disconnect(msg);
    }

    if (loop) {
      loop.on_tick = null;
      loop.kill();
      loop         = null;
    }

    if (callback) callback();
  }
  
  this.on('*::world::start', function() {
    if (!loop) {
      logger.log('info', 'Bringing world online...');
      start();
    } else {
      logger.log('warn', 'World instance appears to already be running.');
    }
  });
  
  this.on('*::world::stop', function(reason) {
    var msg = reason || 'Bringing down world server...';
    logger.log('info', msg);
    stop(msg);
  });
  
  this.on('*::world::restart', function(reason) {
    var msg = reason || 'Restarting world server...';
    logger.log('info', msg);
    stop(msg, start);
  });
  
  this.on('*::login::success', function(username) {
    world.player_logged_in(username);
  });
  
  this.on('hook::ready', function() {
    start();
  });
}

util.inherits(WorldHook, Hook);
