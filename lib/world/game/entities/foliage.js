var Entity = require("./../../lib/entity").Entity;

function Foliage() {
  this.init();

  this.type = "foliage";
}

Foliage.prototype = new Entity();

Foliage.prototype.def = function() {
  return {
    id: this.id,
    t:  this.type,
    p:  this.position,
    b:  this.bounds
  };
}

try {
  exports.Foliage = Foliage;
} catch(e) { };
