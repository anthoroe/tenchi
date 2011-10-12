var EventEmitter = require('events').EventEmitter;

const OPS = {
  LOGIN_SUCCESS: 1000
};

function Login() {
  this.on('login',  this.login);
  this.on('logout', this.logout);
}

// extend node.js EventEmitter
Login.prototype = new EventEmitter();

Login.prototype.init = function(hook) {
  // hook.io system
  this.hook = hook;
}

Login.prototype.login = function(socket, message) {
  // TODO: eventually we do an actual login, find what world instance their
  //       character is on, and hand back the connection to that world
  socket.json.send({ op: OPS.LOGIN_SUCCESS, m: { s: "http://localhost:7000" } });
}

Login.prototype.logout = function(socket) {
  this.hook.emit('user::logout', socket);
}

try {
  exports.Login = Login;
} catch(e) { };

