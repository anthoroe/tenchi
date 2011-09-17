var Entity = require("./../../lib/entity").Entity,
    uid    = require('./../../lib/uid').uid;
    
var ENTITY_ACTIONS = require("./../../lib/entity").ENTITY_ACTIONS;
    
const PLAYER_ACTIONS = {
  MOVE: 0,
  STOP: 1
};

function Player() {
  
}

Player.prototype = new Entity();
Player.prototype.parent = Entity.prototype;

Player.prototype.init = function(client) {
  this.parent.init.call(this);

  var self = this;
  
  this.client      = client;
  this.id          = client.id;
  this.type        = "player";
  this.name        = "Guest" + uid();
  this.is_moveable = true;
  this.move_rate   = 200;
  this.move_acc    = 300;
  this.move_stop   = true;
  this.bounds      = { w: 10, h: 10 };

  this.client.on(PLAYER_ACTIONS.MOVE, function(message) {
    self.set(ENTITY_ACTIONS.MOVE, true);
    self.rotation = message.r;
  });
  this.client.on(PLAYER_ACTIONS.STOP, function(message) {
    self.set(ENTITY_ACTIONS.MOVE, false);
  });
}

Player.prototype.def = function() {
  return {
    id: this.id,
    t:  this.type,
    n:  this.name,
    r:  this.rotation,
    v:  this.velocity,
    p:  this.position,
    b:  this.bounds
  };
}

try {
  exports.Player = Player;
} catch(e) { };
