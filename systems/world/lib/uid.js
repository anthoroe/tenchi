// unique id generator
var uid = (
  function() {
    var id = 0; 
    return function(){
      return id++ ;
    };
  } 
)();

exports.uid = uid;
