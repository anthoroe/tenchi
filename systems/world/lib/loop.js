var DT = 0.017;

function Loop(tick) {
  this.pid     = null;
  this.kill    = false;
  this.tick    = tick || 0;
  this.on_tick = function() {};
  this.on_done = function() {};
}

Loop.prototype.start = function() {
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
      on_tick(self.tick, dt);
      self.tick   += dt;
    }
    
    on_done(self.tick, dt, accumulator / dt);
  };
  
  self.pid = setInterval(loop, 10);
}

Loop.prototype.kill = function() {
  this.kill = true;
  if (this.pid) {
    clearInterval(this.pid);
  }
}

try {
  exports.Loop = Loop;
} catch (e) { };
