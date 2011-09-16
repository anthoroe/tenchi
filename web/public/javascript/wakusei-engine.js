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
function WakuseiEvents() {
  this.events = {};
}

WakuseiEvents.prototype.on = function(name, method) {
  if (this.events[name] == undefined) {
    this.events[name] = {
      'listeners' : [],
    }
  }
  this.events[name].listeners.push(method);
}

WakuseiEvents.prototype.remove = function(name, method) {
  for (var i = 0; i < this.events[name].listeners.length; i++) {
    if (this.events[name].listeners[i]  == method) {
      delete this.events[name].listeners[i];
    }
  }
  if (this.events[name].listeners.length == 0)
    delete this.events[name];
}

WakuseiEvents.prototype.emit = function(name, params) {
  for (var i = 0; i < this.events[name].listeners.length; i++) {
    this.events[name].listeners[i](params);
  }
}

/**
 * Core Internal Network
 */
function WakuseiNetwork(events) {
  this.socket = null;
  this.events = events;
}

WakuseiNetwork.prototype.init = function(host) {
  var wakusei = this;
  this.socket = io.connect(host);
  
  wakusei.events.on('connected', function() { });
  wakusei.events.on('network_message', function(message) { });
  wakusei.events.on('disconnected', function() { });
  
  this.socket.on('connect', function() {
    wakusei.events.emit('connected');
  });
  this.socket.on('message', function(message) {
    wakusei.events.emit('network_message', message);
  });
  this.socket.on('disconnect', function() {
    wakusei.events.emit('disconnected');
  });
}

WakuseiNetwork.prototype.disconnect = function() {
  this.socket.disconnect();
}

WakuseiNetwork.prototype.send = function(command, message) {
  this.socket.emit(command, message);
}

/**
 * Top Level Engine
 */
function WakuseiEngine() {
  this.events    = new WakuseiEvents();
  this.network   = new WakuseiNetwork(this.events);
  
  this.main_loop = null;
  this.main      = function() {};
  
  this.init();
}

WakuseiEngine.prototype.init = function() {
  var wakusei = this;
  //this.main_loop = setInterval(function() {
  //  wakusei.main();
  //}, 0.02);
}
