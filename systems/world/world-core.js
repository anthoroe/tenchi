var Hook    = require('hook.io').Hook,
    util    = require('util'),
    io      = require("socket.io"),
    Logger  = require("../shared/logger").Logger,
    Loop    = require("./lib/loop").Loop,
    World   = require("./game/world").World;
    
var WorldCore = exports.WorldCore = function(options) {
  
  var self = this;
  Hook.call(this, options);
  
  this.on('hook::ready', function() {
    
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

      world = new World();
      world.build();

      loop  = new Loop();
      loop.on_tick = on_tick;

      logger.log('info', 'Starting game loop...');

      loop.start();
    }

    function stop() {
      for (var id in connections) {
        connections[id].disconnect('Server is shutting down.');
      }

      if (loop) {
        loop.on_tick = null;
        loop.kill();
        loop         = null;
      }
    }

    start();
    
  });
}

util.inherits(WorldCore, Hook);
