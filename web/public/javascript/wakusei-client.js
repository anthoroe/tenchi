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

function WakuseiClient() {
  //-----------------------------------
  // setup
  //-----------------------------------
  var wakusei_client = this;
  var wakusei_engine = this.wakusei_engine = new WakuseiEngine();
  
  // network init
  this.wakusei_engine.network.init('http://127.0.0.1:8080');
  
  //-----------------------------------
  // events
  //-----------------------------------
  this.wakusei_engine.events.on('client_id', bind(wakusei_client, wakusei_client.set_client_id));
  this.wakusei_engine.events.on('login', bind(wakusei_client, wakusei_client.login));
  this.wakusei_engine.events.on('login_failed', bind(wakusei_client, wakusei_client.login_failed));
  this.wakusei_engine.events.on('player_move', bind(wakusei_client, wakusei_client.player_move));
  this.wakusei_engine.events.on('player_stop', bind(wakusei_client, wakusei_client.player_stop));
  
  // screen
  this.wakusei_engine.events.on('set_screen', bind(wakusei_client, wakusei_client.set_screen));
  
  // keys
  this.wakusei_engine.events.on('key_down', bind(wakusei_client, wakusei_client.key_down));
  this.wakusei_engine.events.on('key_up', bind(wakusei_client, wakusei_client.key_up));
  this.wakusei_engine.events.on('key_event', bind(wakusei_client, wakusei_client.key_event));
  this.wakusei_engine.events.on('mouse_event', bind(wakusei_client, wakusei_client.mouse_event));
  
  // object spawning / moving
  this.wakusei_engine.events.on('object_spawned', bind(wakusei_client, wakusei_client.object_spawned));
  this.wakusei_engine.events.on('object_despawned', bind(wakusei_client, wakusei_client.object_despawned));
  this.wakusei_engine.events.on('object_moved', bind(wakusei_client, wakusei_client.object_moved));
  
  // chat
  this.wakusei_engine.events.on('player_chat', bind(wakusei_client, wakusei_client.player_chat));
  
  // network events
  this.wakusei_engine.events.on('network_message', function(message) {
    wakusei_engine.events.emit(OPS[message.op], message.m)
  });
  
  // renderer
  setTimeout(function() {
    wakusei_client.help();
    // init wakusei renderer
    wakusei_renderer.init();
    // start render loop
    render_loop();
    // display stats
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    $("body").append(stats.domElement);
    $("#chat").css("top", ($(window).height() - $("#chat").css("height") + 20));
  }, 1000);
  
  //-----------------------------------
  // management
  //-----------------------------------
  this.objects = {};

  this.client_id = null;
  this.player = null;
  this.is_logged_in = false;
  
  // keyboard
  this.key_tracker = [];
  for (var i = 0; i < 256; i++) {
    this.key_tracker[i] = 0;
  }
  
  // movement
  this.last_move_time = null;
  
  // screen
  this.display_screen = 2; // 0 - login, 1 - character, 2 - game
  
  // login
  this.login_input = {
    user: null,
    pass: null
  };
  
  // chat
  this.chatting = false;
  this.chat_input = '';
}

WakuseiClient.prototype.login = function(result) {
  if (result.m == "success") {
    this.is_logged_in = true;
    wakusei_engine.events.emit('set_screen', "game");
  } else {
    wakusei_engine.events.emit('login_failed');
  }
}

WakuseiClient.prototype.login_failed = function() {
  
}

WakuseiClient.prototype.set_client_id = function(obj) {
  this.client_id = obj.id;
}

WakuseiClient.prototype.player_chat = function(message) {
  this.chat_history.push(message);
}

WakuseiClient.prototype.object_spawned = function(object) {
  if (object.id == this.client_id)
    this.player = object;  
  this.objects[object.id] = object;
  wakusei_renderer.add(object);
}

WakuseiClient.prototype.object_despawned = function(object) {
  wakusei_renderer.remove(object);
  delete this.objects[object.id];
}

WakuseiClient.prototype.update_object = function(object) {
  this.objects[object.id] = object;
  wakusei_renderer.update(object);
}

WakuseiClient.prototype.object_moved = function(object) {
  if (object.id == this.client_id)
    this.player = object;
  this.update_object(object);
}

WakuseiClient.prototype.set_screen = function(screen) {
  switch (screen) {
    case "login":
      this.display_screen = 0;
      break;
    case "character":
      this.display_screen = 1;
      break;
    case "game":
      this.display_screen = 2;
      break;
  }
}

/**
  Movement:
  
    Note that the client only supplies a rotation in degrees that it wishes to head.
    The actual speed of the player, and their ability to move in said direction
    is all determined on the server side.
    
    We limit the rate so that the client doesn't DoS the server.
    TODO: Might have to add a check on the server so this isn't abused.

*/
WakuseiClient.prototype.player_move = function(direction) {
  if (this.chatting) return;
  this.send(PLAYER_ACTIONS.MOVE, { r: direction * (Math.PI / 180) }, true);
}

WakuseiClient.prototype.player_stop = function() {
  if (this.chatting) return;
  this.send(PLAYER_ACTIONS.STOP);
}

WakuseiClient.prototype.key_down = function(key) {
  if (key == 13) {
    if (this.chatting == false) {
      this.chat_box();
    }
    return;
  }
  
  this.key_tracker[key] = 1;
  this.wakusei_engine.events.emit("key_event");
}

WakuseiClient.prototype.key_up = function(key) {
  this.key_tracker[key] = 0;
  this.wakusei_engine.events.emit("key_event");
}

WakuseiClient.prototype.key_event = function() {
  if (this.key_tracker[87] == 1 && this.key_tracker[68] == 1) { // w + d
    this.wakusei_engine.events.emit('player_move', 135);
  } else if (this.key_tracker[87] == 1 && this.key_tracker[65] == 1) { // w + a
    this.wakusei_engine.events.emit('player_move', 225);
  } else if (this.key_tracker[83] == 1 && this.key_tracker[68] == 1) { // s + d
    this.wakusei_engine.events.emit('player_move', 45);
  } else if (this.key_tracker[83] == 1 && this.key_tracker[65] == 1) { // s + a
    this.wakusei_engine.events.emit('player_move', 315);
  } else if (this.key_tracker[87] == 1) { // w
    this.wakusei_engine.events.emit('player_move', 180);
  } else if (this.key_tracker[83] == 1) { // s
    this.wakusei_engine.events.emit('player_move', 360);
  } else if (this.key_tracker[65] == 1) { // a
    this.wakusei_engine.events.emit('player_move', 270);
  } else if (this.key_tracker[68] == 1) { // d
    this.wakusei_engine.events.emit('player_move', 90);
  } else if (this.key_tracker[87] == 0 && this.key_tracker[68] == 0 && this.key_tracker[83] == 0 && this.key_tracker[65] == 0) {
    this.wakusei_engine.events.emit('player_stop');
  }
}

WakuseiClient.prototype.send = function(command, message) {
  this.wakusei_engine.network.send(command, message);
}

WakuseiClient.prototype.mouse_event = function(data) {
  var rotation = Math.atan2(data.y, data.x) * (180 / Math.PI);
  this.send('shoot', { r: rotation });
}

WakuseiClient.prototype.chat_box = function() {
  this.chatting = true;
  var wakusei_client = this;
  $("#chat_box_input").focus();
  $("#chat_box_input").keypress(function(event) {
    if (event.which == 13) {
      var data = $("#chat_box_input").val().split(' ');
      if (data[0] == "/help") {
        wakusei_client.help();
      } else if (data[0] == "/nick") {
        wakusei_client.send_nick(data[1]);
      } else {
        wakusei_client.send_chat($("#chat_box_input").val());
      }
    }
  });
}

WakuseiClient.prototype.focus_renderer = function() {
  this.chatting = false;
  $("#chat_box_input").val('').blur();
  $("#chat_box_input").unbind('keypress');
  $("#renderer").focus();
}

WakuseiClient.prototype.help = function() {
  this.player_chat({ t: new Date().getTime(), n: "System", m: "Welcome to Wakusei" });
  this.player_chat({ t: new Date().getTime(), n: "System", m: "  Click the canvas area to interact." });
  this.player_chat({ t: new Date().getTime(), n: "System", m: "  Type /nick |nick| to change your name." });
  this.player_chat({ t: new Date().getTime(), n: "System", m: "  Press |enter| to input text chat, and |enter| again to send it." });
  this.player_chat({ t: new Date().getTime(), n: "System", m: "  Press the WSAD keys to move." });
  this.player_chat({ t: new Date().getTime(), n: "System", m: "  Left click anywhere to shoot in that direction." });
  this.focus_renderer();
}

WakuseiClient.prototype.send_chat = function(chat) {
  this.focus_renderer();
  if (chat.length > 0)
    this.send('chat', { c: chat });
}

WakuseiClient.prototype.send_nick = function(nick) {
  this.focus_renderer();
  if (nick.length > 0)
    this.send('nick', { n: nick });
}

WakuseiClient.prototype.player_chat = function(chat) {
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
  wakusei_client.wakusei_engine.events.emit("key_down", event.which);
  event.preventDefault();
});

$(document).keypress(function(event) {
  wakusei_client.wakusei_engine.events.emit("key_down", event.which);
  event.preventDefault();
});

$(document).keyup(function(event) {
  wakusei_client.wakusei_engine.events.emit("key_up", event.which);
});
