var Entity = require("./../../lib/entity").Entity;

function Building() {
  this.init();

  this.type          = "building";
  this.is_collidable = true;
}

Building.prototype = new Entity();

Building.prototype.def = function() {
  return {
    id: this.id,
    t:  this.type,
    p:  this.position,
    b:  this.bounds
  };
}

try {
  exports.Building = Building;
} catch(e) { };
