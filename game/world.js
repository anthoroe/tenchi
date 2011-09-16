var EventEmitter = require('events').EventEmitter,
    Randomizer   = require('./../lib/randomizer').Randomizer,
    Player       = require("./entities/player").Player,
    Npc          = require("./entities/npc").Npc,
    Foliage      = require("./entities/foliage").Foliage;
    
const OPS = {
  ENTITY_SPAWN:   0,
  ENTITY_DESPAWN: 1,
  ENTITY_MOVE:    2,
  CLIENT_ID:      100
};

function World() {
  this.players    = {};
  this.entities   = {};
  this.s_entities = {};
  
  // network messages
  this.on('on_connection', this.on_connection);
  this.on('on_disconnect', this.on_disconnect);
  
  // game loop
  this.on('on_update',     this.on_update);
}

// extend node.js EventEmitter
World.prototype = new EventEmitter();

World.prototype.build = function() {
  var randomizer = new Randomizer();

  var range = 2000;
  for (var i = 0; i < 1000; i++) {
    var foliage = new Foliage();
    foliage.position.x = randomizer.random(range) + -(range / 2);
    foliage.position.y = randomizer.random(range) + -(range / 2);
    foliage.bounds.w   = randomizer.random(10) + 10;
    foliage.bounds.h   = randomizer.random(10) + 10;
    this.s_entities[foliage.id] = foliage;
  }
}

World.prototype.on_update = function(t, dt) {
  for (var id in this.players) {
    this.players[id].update(t, dt);
  }
  for (var id in this.entities) {
    this.entities[id].update(t, dt);
  }
}

World.prototype.on_connection = function(socket) {
  var self = this;
  
  var player = new Player();
  player.init(socket);
  player.client.json.send({ op: OPS.CLIENT_ID, m: { id: socket.id } });
  
  for (var id in this.s_entities) {
    player.client.json.send({ op: OPS.ENTITY_SPAWN, m: this.s_entities[id].def() });
  }
  for (var id in this.entities) {
    player.client.json.send({ op: OPS.ENTITY_SPAWN, m: this.entities[id].def() });
  }
  for (var id in this.players) {
    player.client.json.send({ op: OPS.ENTITY_SPAWN, m: this.players[id].def() });
  }
  
  player.on('entity_move', function(e) {
    self.on_entity_move(e);
  });
  
  this.players[socket.id] = player;
  this.broadcast(OPS.ENTITY_SPAWN, player.def());
}

World.prototype.on_disconnect = function(socket) {
  this.broadcast(OPS.ENTITY_DESPAWN, this.players[socket.id].def());
  delete this.players[socket.id];
}

World.prototype.on_entity_move = function(entity) {
  this.broadcast(OPS.ENTITY_MOVE, entity.def());
}

World.prototype.broadcast = function(op, message) {
  for (var id in this.players) {
    this.players[id].client.json.send({ op: op, m: message });
  }
}

try {
  exports.World = World;
} catch(e) { };
