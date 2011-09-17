var DT = 0.017;

const ENTITY_ACTIONS = {
  MOVE: 1
};

// The ever important bind function
function toArray(obj) {
    return Array.prototype.slice.call(obj);
}

function bind(scope, fn) {
  return function () {
    return fn.apply(scope, toArray(arguments));
  };
}

/**
 * Core Event System
 */
function TenchiEvents() {
  this.events = {};
}

TenchiEvents.prototype.on = function(name, method) {
  if (this.events[name] == undefined) {
    this.events[name] = {
      'listeners' : [],
    }
  }
  this.events[name].listeners.push(method);
}

TenchiEvents.prototype.remove = function(name, method) {
  for (var i = 0; i < this.events[name].listeners.length; i++) {
    if (this.events[name].listeners[i]  == method) {
      delete this.events[name].listeners[i];
    }
  }
  if (this.events[name].listeners.length == 0)
    delete this.events[name];
}

TenchiEvents.prototype.emit = function(name, params) {
  for (var i = 0; i < this.events[name].listeners.length; i++) {
    this.events[name].listeners[i](params);
  }
}

/**
 * Core Internal Network
 */
function TenchiNetwork(events) {
  this.socket = null;
  this.events = events;
}

TenchiNetwork.prototype.init = function(host) {
  var self = this;
  this.socket = io.connect(host);
  
  self.events.on('connected', function() { });
  self.events.on('network_message', function(message) { });
  self.events.on('disconnected', function() { });
  
  this.socket.on('connect', function() {
    self.events.emit('connected');
  });
  this.socket.on('message', function(message) {
    self.events.emit('network_message', message);
  });
  this.socket.on('disconnect', function() {
    self.events.emit('disconnected');
  });
}

TenchiNetwork.prototype.disconnect = function() {
  this.socket.disconnect();
}

TenchiNetwork.prototype.send = function(command, message, volatile) {
  if (volatile)
    this.socket.volatile.emit(command, message);
  else
    this.socket.emit(command, message);
}

/**
 * Top Level Engine
 */
function TenchiEngine(client) {
  var self = this;
  
  this.client    = client;
  this.events    = new TenchiEvents();
  this.network   = new TenchiNetwork(this.events);
  this.renderer  = new TenchiRenderer();

  this.pid     = null;
  this.kill    = false;
  this.tick    = 0;
  
  this.start();
  
  this.events.on('disconnected', function() {
    self.kill();
  });
}

TenchiEngine.prototype.on_tick = function(self, t, dt) {
  for (var id in self.client.objects) {
    if (self.client.objects[id].t == "npc")
      self.entity_update(self.client.objects[id], t, dt);
  }
}

TenchiEngine.prototype.start = function() {
  var self         = this,
      on_tick      = self.on_tick,
      on_done      = self.on_done,
      accumulator  = 0,
      dt           = DT,
      current_time = new Date().getTime();
      
  this.kill = false;
  
  function loop() {
    var new_time = new Date().getTime();
    var delta    = (new_time - current_time) / 1000;
    current_time = new_time;
    
    if (delta > 0.25) delta = 0.25;
    
    accumulator += delta;
    
    while (accumulator >= dt) {
      accumulator -= dt;
      on_tick(self, self.tick, dt);
      self.tick   += dt;
    }
  };
  
  self.pid = setInterval(loop, 10);
}

TenchiEngine.prototype.kill = function() {
  this.kill = true;
  if (this.pid) {
    clearInterval(this.pid);
  }
}

TenchiEngine.prototype.entity_is = function(entity, flag) {
  return (entity.a & flag) == flag;
}

TenchiEngine.prototype.entity_update = function(entity, t, dt) {
  var rotation  = entity.r;
  var max_speed = entity.mr;
  var acc_speed = entity.ma;
  
  var acc     = this.entity_is(entity, ENTITY_ACTIONS.MOVE) ? dt * acc_speed : 0;
  var speed_x = entity.v.x + (acc * Math.sin(rotation));
  var speed_y = entity.v.y - (acc * Math.cos(rotation));
  var speed   = Math.sqrt(Math.pow(speed_x, 2) + Math.pow(speed_y, 2));

  if (speed > max_speed) {
    speed_x = speed_x / speed * max_speed;
    speed_y = speed_y / speed * max_speed;
  }

  entity.v.x = speed_x;
  entity.v.y = speed_y;

  entity.p.x = this.lerp(entity.p.x, (entity.p.x + speed_x * dt), t % 1);
  entity.p.y = this.lerp(entity.p.y, (entity.p.y + speed_y * dt), t % 1);
  
  this.renderer.update(entity);
}

TenchiEngine.prototype.lerp = function(a, b, t) {
  return (a + t * (b - a));
}

