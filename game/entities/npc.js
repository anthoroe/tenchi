var Entity = require("./../../lib/entity").Entity;

function Npc() {
  this.init();

  var self = this;
  
  this.type        = "npc";
  this.is_moveable = true;
  this.is_harmable = true;
  this.move_rate   = 10.0;
  this.bounds      = { w: 10, h: 10 };
}

Npc.prototype = new Entity();

Npc.prototype.def = function() {
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
  exports.Npc = Npc;
} catch(e) { };
