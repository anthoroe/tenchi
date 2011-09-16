var EventEmitter = require('events').EventEmitter,
    uid    = require('./../lib/uid').uid;
    
const ENTITY_ACTIONS = {
  MOVE: 1
};

function Entity() {

}

// extend node.js EventEmitter
Entity.prototype = new EventEmitter();

Entity.prototype.init = function() {
  var self = this;
  
  this.id            = uid();
  this.type          = 'entity';
  this.rotation      = 0.0;
  this.velocity      = { x: 0, y: 0 };
  this.position      = { x: 0, y: 0 };
  this.bounds        = { w: 1, h: 1 };
  this.is_collidable = false;
  this.is_moveable   = false;
  this.is_harmable   = false;
  this.causes_harm   = false;
  this.move_rate     = 0.0;
  this.move_acc      = 0.0;
  this.dead          = false;
  this.action        = 0;
}

Entity.prototype.is = function(flag) {
  return (this.action & flag) == flag;
}

Entity.prototype.set = function(flag, value) {
  this.action = value ? this.action | flag : this.action & ~flag;
}

Entity.prototype.toggle = function(flag) {
  if (this.action & flag == flag)  {
    this.action = this.action & ~flag;
  } else {
    this.action |= flag;
  }
}

Entity.prototype.update = function(t, dt) {
  this.move(t, dt);
}

Entity.prototype.move = function(t, dt) {
  if (!this.is_moveable || this.dead) return;

  var rotation  = this.rotation;
  var max_speed = this.move_rate;
  var acc_speed = this.move_acc;
  
  var acc     = this.is(ENTITY_ACTIONS.MOVE) ? dt * acc_speed : 0;
  var speed_x = this.velocity.x + (acc * Math.sin(rotation));
  var speed_y = this.velocity.y - (acc * Math.cos(rotation));
  var speed   = Math.sqrt(Math.pow(speed_x, 2) + Math.pow(speed_y, 2));

  if (speed > max_speed) {
    speed_x = speed_x / speed * max_speed;
    speed_y = speed_y / speed * max_speed;
  }

  if (this.is(ENTITY_ACTIONS.MOVE)) {
    this.velocity.x = speed_x;
    this.velocity.y = speed_y;
  } else {
    this.velocity.x = 0;
    this.velocity.y = 0;
  }
  
  this.position.x = this.position.x + speed_x * dt;
  this.position.y = this.position.y + speed_y * dt;

  this.emit('entity_move', this);
}

try {
  exports.Entity = Entity;
  exports.ENTITY_ACTIONS = ENTITY_ACTIONS;
} catch(e) { };
