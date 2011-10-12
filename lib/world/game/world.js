var EventEmitter = require('events').EventEmitter,
    Randomizer   = require('../lib/randomizer').Randomizer,
    Player       = require("./entities/player").Player,
    Npc          = require("./entities/npc").Npc,
    Foliage      = require("./entities/foliage").Foliage,
    Building     = require("./entities/building").Building;
    
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
  
  this.game_tick = 0;
  this.packet = {
    count:    0,
    rate_mod: 10
  }
  
  // network messages
  this.on('on_connection', this.on_connection);
  this.on('on_disconnect', this.on_disconnect);
  
  // game loop
  this.on('on_update',     this.on_update);
}

// extend node.js EventEmitter
World.prototype = new EventEmitter();

World.prototype.build = function() {
  var self = this;
  
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
  
  var building = new Building();
  building.position.x = 100;
  building.position.y = 100;
  building.bounds.w   = 100;
  building.bounds.h   = 100;
  this.s_entities[building.id] = building;
  
  var building = new Building();
  building.position.x = -100;
  building.position.y = -100;
  building.bounds.w   = 50;
  building.bounds.h   = 200;
  this.s_entities[building.id] = building;

  this.npc_count = 0;
  this.npc_limit = 50;
  this.npc_respawn = 500;
  this.spawner = setInterval(function() {
    if (self.npc_count < self.npc_limit) {
      var npc = new Npc();
      npc.position.x = randomizer.random(range) + -(range / 2);
      npc.position.y = randomizer.random(range) + -(range / 2);
      npc.on('entity_move', function(npc) {
        self.on_entity_move(npc);
      });
      npc.on('entity_despawn', function(npc) {
        self.npc_count -= 1;
        self.on_entity_despawn(npc);
        delete self.entities[npc.id];
      });
      self.entities[npc.id] = npc;
      self.on_entity_spawn(self.entities[npc.id]);
      self.npc_count += 1;
    }
  }, self.npc_respawn);
}

World.prototype.on_update = function(t, dt) {
  this.game_tick = t;

  for (var id in this.players) {
    this.players[id].update(t, dt);
  }
  for (var id in this.entities) {
    this.entities[id].update(t, dt);
  }
  
  if (Math.floor(this.game_tick * 1000) % 60 == 0) {
    this.packet.count = 0;
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
    self.on_entity_move(e, 'medium');
  });
  player.on('entity_despawn', function(e) {
    self.on_entity_despawn(e);
  });
  
  this.players[socket.id] = player;
  this.on_entity_spawn(this.players[socket.id]);
}

World.prototype.on_disconnect = function(socket) {
  if (!this.players[socket.id]) return false;

  this.players[socket.id].destroy();
  this.broadcast(OPS.ENTITY_DESPAWN, this.players[socket.id].def(), 'high');
  delete this.players[socket.id];
}

World.prototype.on_entity_move = function(entity, priority) {
  if (!priority)
    priority = 'low';
  this.broadcast(OPS.ENTITY_MOVE, entity.def(), priority);
}

World.prototype.on_entity_spawn = function(entity) {
  this.broadcast(OPS.ENTITY_SPAWN, entity.def(), 'high');
}

World.prototype.on_entity_despawn = function(entity) {
  this.broadcast(OPS.ENTITY_DESPAWN, entity.def(), 'high');
}

World.prototype.broadcast = function(op, message, priority) {
  switch (priority) {
    case 'high':
      for (var id in this.players) {
        this.packet.count += 1;
        this.players[id].client.json.send({ op: op, m: message });
      }
      break;
    case 'medium':
      for (var id in this.players) {
        this.packet.count += 1;
        this.players[id].client.volatile.json.send({ op: op, m: message });
      }
      break;
    case 'low':
      if (Math.floor(this.game_tick * 1000) % this.packet.rate_mod == 0) {
        for (var id in this.players) {
          this.packet.count += 1;
          this.players[id].client.volatile.json.send({ op: op, m: message });
        }
      }
      break;
  }
}

try {
  exports.World = World;
} catch(e) { };
