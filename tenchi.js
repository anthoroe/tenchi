#!/usr/bin/env node

var sys          = require('sys'),
    EventEmitter = require('events').EventEmitter,
    express      = require("express"),
    io           = require("socket.io"),
    Logger       = require("./lib/logger").Logger,
    Loop         = require("./lib/loop").Loop,
    World        = require("./game/world").World;
    
const SERVER_VERSION = '1.0';

const DEFAULT_OPTIONS = {
  debug:          true,
  name:           "Tenchi",
  host:           "127.0.0.1",
  port:           8080,
  max_players:    100,
  log_level:      1
};

function main() {
  var web  = null,
      game = null;
      
  web  = web_init();
  game = game_init(web);
}

function web_init() {
  var web = express.createServer();
  web.configure(function() {
  	web.use(express.static(__dirname + '/web/public'));
  	web.set('view engine', 'jade');
  	web.set('views', __dirname +'/web/views');
  });

  web.get('/', function(req, res) {
  	res.render('index');
  });
  web.listen(DEFAULT_OPTIONS.port);
  
  return web;
}

function game_init(web) {
  var connections   = {},
      world         = null,
      update_tick   = 1,
      loop          = null,
      socket_server = null,
      web_server    = web,
      logger        = new Logger();
      
  function server(web) {
    socket_server = io.listen(web);
    socket_server.set('log level', DEFAULT_OPTIONS.log_level);

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
    server(web_server);
    
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
  return socket_server;
}

main();
