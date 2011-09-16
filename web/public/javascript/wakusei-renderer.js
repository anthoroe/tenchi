window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

var WIDTH  = $(window).width() / 2,
    HEIGHT = $(window).height() / 2;

var VIEW_ANGLE = 45,
    ASPECT = WIDTH / HEIGHT,
    NEAR = 0.1,
    FAR = 10000;
  
var X = WIDTH  / 2;
var Y = HEIGHT / 2;

function WakuseiRenderer() {
  this.renderer = new THREE.WebGLRenderer();
  this.camera   = new THREE.Camera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  this.scene    = new THREE.Scene();
  
  this.scene_objects = {};
  
  this.geometry = new THREE.CubeGeometry(1, 1, 1);
}

WakuseiRenderer.prototype.add = function(object) {
  var x_coord  = Math.floor(object.p.x);
  var y_coord  = Math.floor(object.p.y);
  var z_coord  = 0;
  var width    = object.b.w;
  var height   = object.b.h;
  
  var material_params = { shading: THREE.SmoothShading };
  
  switch (object.t) {
    case "foliage":    
      material_params.color = 0x006400;
      z_coord = -1;
      break;
    case "building":
      material_params.color = 0xA0522D;
      z_coord = 0;
      break;
    case "npc":
      material_params.color = 0x8B0000;
      z_coord = 1;
      break;
    case "projectile":
      material_params.color = 0xFFD700;
      z_coord = 2;
      break;
    case "player":
      if (object.id == wakusei_client.player.id) {
        material_params.color = 0x00CED1;
      } else {
        material_params.color = 0xFF1493;
      }
      z_coord = 3;
      break;
  }
  
  var material = new THREE.MeshLambertMaterial(material_params);
  var mesh = new THREE.Mesh(this.geometry, material);
  mesh.wakusei = {
    type: object.t
  };
  mesh.position.x = x_coord;
  mesh.position.y = y_coord;
  mesh.position.z = z_coord;
  mesh.scale.x = width;
  mesh.scale.y = height;
  
  this.scene_objects[object.id] = mesh;
  this.scene.addObject(mesh);
}

WakuseiRenderer.prototype.remove = function(object) {
  if (this.scene_objects[object.id] != undefined)
    this.scene.removeObject(this.scene_objects[object.id]);
  delete this.scene_objects[object.id];
}

WakuseiRenderer.prototype.update = function(object) {
  this.scene_objects[object.id].position.x = object.p.x;
  this.scene_objects[object.id].position.y = object.p.y;
  
  // update camera
  if (object.id == wakusei_client.client_id) {
    this.camera.target = this.scene_objects[object.id]; // always point at player
    this.camera.position.x = Math.floor(object.p.x);
    this.camera.position.y = Math.floor(object.p.y);
  }
}

WakuseiRenderer.prototype.init = function() {
  // set view distance back
  this.camera.position.z = 1000;
  
  // set rendering area size
  this.renderer.setSize(WIDTH, HEIGHT);

  $("#renderer").append(this.renderer.domElement);
  
  // create a point light
  var pointLight = new THREE.PointLight(0xFFFFFF);
  pointLight.position.x = 10;
  pointLight.position.y = 50;
  pointLight.position.z = 130;
  this.scene.addLight(pointLight);
  
  var ambientLight = new THREE.AmbientLight(0xFFFFF0);
  this.scene.addLight(ambientLight);
}

WakuseiRenderer.prototype.draw = function() {
  this.renderer.render(this.scene, this.camera);
}

function render_loop() {
  requestAnimFrame(render_loop);
  wakusei_renderer.draw();
  stats.update();
}
