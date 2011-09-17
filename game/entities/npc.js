var Entity     = require("./../../lib/entity").Entity,
    Randomizer = require('./../../lib/randomizer').Randomizer;

var ENTITY_ACTIONS = require("./../../lib/entity").ENTITY_ACTIONS;

function Npc() {
  this.init();

  var self = this;
  
  this.type        = "npc";
  this.is_moveable = true;
  this.is_harmable = true;
  this.move_rate   = 200;
  this.move_acc    = 300;
  this.move_stop   = false;
  this.bounds      = { w: 10, h: 10 };
}

Npc.prototype = new Entity();

Npc.prototype.def = function() {
  return {
    id: this.id,
    t:  this.type,
    n:  this.name,
    a:  this.action,
    r:  this.rotation,
    v:  this.velocity,
    p:  this.position,
    b:  this.bounds,
    mr: this.move_rate,
    ma: this.move_acc
  };
}

Npc.prototype.simulate = function(t, dt) {
  var randomizer = new Randomizer();
  if (randomizer.random(100) > 75) {
    this.rotation = randomizer.random(360);
    this.set(ENTITY_ACTIONS.MOVE, true);
  } else {
    this.set(ENTITY_ACTIONS.MOVE, false);
  }
}

try {
  exports.Npc = Npc;
} catch(e) { };
