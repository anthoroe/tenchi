var Logger = function() {
  this.log = function(level, message) {
    var color;
    switch (level) {
      case 'info':
        color = 33;
        break;
      case 'debug':
        color = 32;
        break;
      case 'warn':
        color = 36;
        break;
      case 'error':
        color = 31;
        break;
      default:
        color = 90;
        break;
    }
    console.log('   [TENCHI] \033[' + color + 'm' + level + ' -\033[39m ' + message)
  }
}

try {
  exports.Logger = Logger;
} catch(e) { };
