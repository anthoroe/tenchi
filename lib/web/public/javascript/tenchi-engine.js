var DT = 0.017;

const ENTITY_ACTIONS = {
  MOVE: 1
};

const OPS = {
  0:   'object_spawned',
  1:   'object_despawned',
  2:   'object_moved',
  100: 'client_id'
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
    self.events.emit(OPS[message.op], message.m);
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
  
  this.pid     = null;
  this.tick    = 0;
  
  this.client    = client;
  this.events    = new TenchiEvents();
  this.network   = new TenchiNetwork(this.events);
  this.renderer  = new TenchiRenderer(this);
  
  this.objects   = {};
  this.client_id = null;
  this.player    = null;
  
  // network events
  this.events.on('disconnected', function() {
    self.kill();
  });
  this.events.on('client_id', function(object) {
    self.client_id = object.id;
    // init and start the renderer
    self.renderer.init();
    // start the engine loop
    self.start();  
  });
  
  // object spawning / moving
  this.events.on('object_spawned', function(object) {
    self.object_spawned(object);
  });
  this.events.on('object_despawned', function(object) {
    self.object_despawned(object);
  });
  this.events.on('object_moved', function(object) {
    self.object_moved(object);
  });
}

TenchiEngine.prototype.on_tick = function(self, t, dt) {
  for (var id in self.objects) {
    if (self.objects[id].t == "player" || self.objects[id].t == "npc")
      self.renderer.update(self.objects[id]);
  }
}

TenchiEngine.prototype.start = function() {
  var self         = this,
      on_tick      = self.on_tick,
      on_done      = self.on_done,
      accumulator  = 0,
      dt           = DT,
      current_time = new Date().getTime();    

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
  if (this.pid) {
    clearInterval(this.pid);
  }
}

TenchiEngine.prototype.object_spawned = function(object) {
  if (object.id == this.client_id)
    this.player = object;  
  this.objects[object.id] = object;
  this.renderer.add(object);
}

TenchiEngine.prototype.object_despawned = function(object) {
  this.renderer.remove(object);
  delete this.objects[object.id];
}

TenchiEngine.prototype.update_object = function(object) {
  object.p.o = this.objects[object.id].p; // old position
  this.objects[object.id] = object;
}

TenchiEngine.prototype.object_moved = function(object) {
  if (object.id == this.client_id)
    this.player = object;
  this.update_object(object);
}
