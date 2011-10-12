var mersenne = require('mersenne');

function Randomizer() {
  
}

Randomizer.prototype.random = function(amount) {
  return mersenne.rand(amount);
}

try {
  exports.Randomizer = Randomizer;
} catch(e) { };
