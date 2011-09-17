const OPS = {
  0:   'object_spawned',
  1:   'object_despawned',
  2:   'object_moved',
  100: 'client_id'
};

const PLAYER_ACTIONS = {
  MOVE: 0,
  STOP: 1
};

function TenchiClient() {
  //-----------------------------------
  // setup
  //-----------------------------------
  var tenchi_client = this;
  var tenchi_engine = this.tenchi_engine = new TenchiEngine(tenchi_client);
  
  // network init
  this.tenchi_engine.network.init('http://127.0.0.1:8080');
  
  //-----------------------------------
  // events
  //-----------------------------------
  this.tenchi_engine.events.on('client_id', bind(tenchi_client, tenchi_client.set_client_id));
  this.tenchi_engine.events.on('login', bind(tenchi_client, tenchi_client.login));
  this.tenchi_engine.events.on('login_failed', bind(tenchi_client, tenchi_client.login_failed));
  this.tenchi_engine.events.on('player_move', bind(tenchi_client, tenchi_client.player_move));
  this.tenchi_engine.events.on('player_stop', bind(tenchi_client, tenchi_client.player_stop));
  
  // screen
  this.tenchi_engine.events.on('set_screen', bind(tenchi_client, tenchi_client.set_screen));
  
  // keys
  this.tenchi_engine.events.on('key_down', bind(tenchi_client, tenchi_client.key_down));
  this.tenchi_engine.events.on('key_up', bind(tenchi_client, tenchi_client.key_up));
  this.tenchi_engine.events.on('key_event', bind(tenchi_client, tenchi_client.key_event));
  this.tenchi_engine.events.on('mouse_event', bind(tenchi_client, tenchi_client.mouse_event));
  
  // object spawning / moving
  this.tenchi_engine.events.on('object_spawned', bind(tenchi_client, tenchi_client.object_spawned));
  this.tenchi_engine.events.on('object_despawned', bind(tenchi_client, tenchi_client.object_despawned));
  this.tenchi_engine.events.on('object_moved', bind(tenchi_client, tenchi_client.object_moved));
  
  // chat
  this.tenchi_engine.events.on('player_chat', bind(tenchi_client, tenchi_client.player_chat));
  
  // network events
  this.tenchi_engine.events.on('network_message', function(message) {
    tenchi_engine.events.emit(OPS[message.op], message.m)
  });
  
  //-----------------------------------
  // management
  //-----------------------------------
  this.objects = {};

  this.client_id = null;
  this.player = null;
  
  // keyboard
  this.key_tracker = [];
  for (var i = 0; i < 256; i++) {
    this.key_tracker[i] = 0;
  }
  
  // chat
  this.chatting = false;
  this.chat_input = '';
}

TenchiClient.prototype.set_client_id = function(obj) {
  this.client_id = obj.id;
  
  // now that we have an id from the server init the renderer
  this.help();
  // init tenchi renderer
  this.tenchi_engine.renderer.init();
  // start render loop
  render_loop();
  // display stats
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  $("body").append(stats.domElement);
  $("#chat").css("top", ($(window).height() - $("#chat").css("height") + 20));
}

TenchiClient.prototype.player_chat = function(message) {
  this.chat_history.push(message);
}

TenchiClient.prototype.object_spawned = function(object) {
  if (object.id == this.client_id)
    this.player = object;  
  this.objects[object.id] = object;
  this.tenchi_engine.renderer.add(object);
}

TenchiClient.prototype.object_despawned = function(object) {
  this.tenchi_engine.renderer.remove(object);
  delete this.objects[object.id];
}

TenchiClient.prototype.update_object = function(object) {
  this.objects[object.id] = object;
  this.tenchi_engine.renderer.update(object);
}

TenchiClient.prototype.object_moved = function(object) {
  if (object.id == this.client_id)
    this.player = object;
  this.update_object(object);
}

/**
 * Movement:
 * 
 *   Note that the client only supplies a rotation in degrees that it wishes to head.
 *   The actual speed of the player, and their ability to move in said direction
 *   is all determined on the server side.
 *   
 *   We limit the rate so that the client doesn't DoS the server.
 *   TODO: Might have to add a check on the server so this isn't abused.
 *
*/
TenchiClient.prototype.player_move = function(direction) {
  if (this.chatting) return;
  this.send(PLAYER_ACTIONS.MOVE, { r: direction * (Math.PI / 180) }, true);
}

TenchiClient.prototype.player_stop = function() {
  if (this.chatting) return;
  this.send(PLAYER_ACTIONS.STOP);
}

TenchiClient.prototype.key_down = function(key) {
  if (key == 13) {
    if (this.chatting == false) {
      this.chat_box();
    }
    return;
  }
  
  this.key_tracker[key] = 1;
  this.tenchi_engine.events.emit("key_event");
}

TenchiClient.prototype.key_up = function(key) {
  this.key_tracker[key] = 0;
  this.tenchi_engine.events.emit("key_event");
}

TenchiClient.prototype.key_event = function() {
  if (this.key_tracker[87] == 1 && this.key_tracker[68] == 1) { // w + d
    this.tenchi_engine.events.emit('player_move', 135);
  } else if (this.key_tracker[87] == 1 && this.key_tracker[65] == 1) { // w + a
    this.tenchi_engine.events.emit('player_move', 225);
  } else if (this.key_tracker[83] == 1 && this.key_tracker[68] == 1) { // s + d
    this.tenchi_engine.events.emit('player_move', 45);
  } else if (this.key_tracker[83] == 1 && this.key_tracker[65] == 1) { // s + a
    this.tenchi_engine.events.emit('player_move', 315);
  } else if (this.key_tracker[87] == 1) { // w
    this.tenchi_engine.events.emit('player_move', 180);
  } else if (this.key_tracker[83] == 1) { // s
    this.tenchi_engine.events.emit('player_move', 360);
  } else if (this.key_tracker[65] == 1) { // a
    this.tenchi_engine.events.emit('player_move', 270);
  } else if (this.key_tracker[68] == 1) { // d
    this.tenchi_engine.events.emit('player_move', 90);
  } else if (this.key_tracker[87] == 0 && this.key_tracker[68] == 0 && this.key_tracker[83] == 0 && this.key_tracker[65] == 0) {
    this.tenchi_engine.events.emit('player_stop');
  }
}

TenchiClient.prototype.send = function(command, message) {
  this.tenchi_engine.network.send(command, message);
}

TenchiClient.prototype.mouse_event = function(data) {
  var rotation = Math.atan2(data.y, data.x) * (180 / Math.PI);
  this.send('shoot', { r: rotation });
}

TenchiClient.prototype.chat_box = function() {
  this.chatting = true;
  var tenchi_client = this;
  $("#chat_box_input").focus();
  $("#chat_box_input").keypress(function(event) {
    if (event.which == 13) {
      var data = $("#chat_box_input").val().split(' ');
      if (data[0] == "/help") {
        tenchi_client.help();
      } else if (data[0] == "/nick") {
        tenchi_client.send_nick(data[1]);
      } else {
        tenchi_client.send_chat($("#chat_box_input").val());
      }
    }
  });
}

TenchiClient.prototype.focus_renderer = function() {
  this.chatting = false;
  $("#chat_box_input").val('').blur();
  $("#chat_box_input").unbind('keypress');
  $("#renderer").focus();
}

TenchiClient.prototype.help = function() {
  this.player_chat({ t: new Date().getTime(), n: "System", m: "Welcome to Tenchi" });
  this.player_chat({ t: new Date().getTime(), n: "System", m: "  Click the canvas area to interact." });
  this.player_chat({ t: new Date().getTime(), n: "System", m: "  Type /nick |nick| to change your name." });
  this.player_chat({ t: new Date().getTime(), n: "System", m: "  Press |enter| to input text chat, and |enter| again to send it." });
  this.player_chat({ t: new Date().getTime(), n: "System", m: "  Press the WSAD keys to move." });
  this.player_chat({ t: new Date().getTime(), n: "System", m: "  Left click anywhere to shoot in that direction." });
  this.focus_renderer();
}

TenchiClient.prototype.send_chat = function(chat) {
  this.focus_renderer();
  if (chat.length > 0)
    this.send('chat', { c: chat });
}

TenchiClient.prototype.send_nick = function(nick) {
  this.focus_renderer();
  if (nick.length > 0)
    this.send('nick', { n: nick });
}

TenchiClient.prototype.player_chat = function(chat) {
  var date = new Date();
  date.setTime(chat.t);
  var time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
  $("#chat").append(
    '<div id="chat_line">' +
    '<span id="chat_time">[' + time + '] </span>' +
    '<span id="chat_user">' + chat.n + ': </span>' +
    '<span id="chat_item">' + chat.m + '</span>' +
    '</div>'
  );
  $("#chat").animate({ scrollTop: $("#chat").attr("scrollHeight") - $("#chat").height() }, 500);
}

$(document).keydown(function(event) {
  tenchi_client.tenchi_engine.events.emit("key_down", event.which);
  event.preventDefault();
});

$(document).keypress(function(event) {
  tenchi_client.tenchi_engine.events.emit("key_down", event.which);
  event.preventDefault();
});

$(document).keyup(function(event) {
  tenchi_client.tenchi_engine.events.emit("key_up", event.which);
});
