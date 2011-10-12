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

function TenchiRenderer(engine) {
  this.engine   = engine;
  
  this.renderer = new THREE.WebGLRenderer();
  this.camera   = new THREE.Camera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  this.scene    = new THREE.Scene();
  
  this.scene_objects = {};
}

TenchiRenderer.prototype.add = function(object) {
  var x_coord  = Math.floor(object.p.x);
  var y_coord  = Math.floor(object.p.y);
  var z_coord  = 0;
  var width    = object.b.w;
  var height   = object.b.h;
  
  var geometry = new THREE.CubeGeometry(1, 1, 1);
  var material_params = { shading: THREE.SmoothShading };
  
  switch (object.t) {
    case "foliage":
      material_params.color = 0x006400;
      z_coord = -2;
      break;
    case "building":
      material_params.color = 0xA0522D;
      z_coord = 0;
      break;
    case "npc":
      geometry = new THREE.SphereGeometry(1, 10, 10);
      material_params.color = 0x8B0000;
      z_coord = 2;
      break;
    case "projectile":
      material_params.color = 0xFFD700;
      z_coord = 4;
      break;
    case "player":
      //geometry = new THREE.Geometry();
      //var v1 = new THREE.Vector2( 1,  0),
      //    v2 = new THREE.Vector2(-1, -1),
      //    v3 = new THREE.Vector2(-1,  1);
      //geometry.vertices.push(new THREE.Vertex(v1));
      //geometry.vertices.push(new THREE.Vertex(v2));
      //geometry.vertices.push(new THREE.Vertex(v3));
      //geometry.faces.push(new THREE.Face3(0, 2, 1));
      //geometry.computeFaceNormals();
      
      geometry = new THREE.SphereGeometry(1, 10, 10);
      if (object.id == this.engine.player.id) {
        material_params.color = 0x00CED1;
      } else {
        material_params.color = 0xFF1493;
      }
      z_coord = 6;
      break;
  }
  
  var material = new THREE.MeshLambertMaterial(material_params);
  var mesh = new THREE.Mesh(geometry, material);
  mesh.tenchi = {
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

TenchiRenderer.prototype.remove = function(object) {
  if (this.scene_objects[object.id] != undefined)
    this.scene.removeObject(this.scene_objects[object.id]);
  delete this.scene_objects[object.id];
}

TenchiRenderer.prototype.update = function(object) {
  if (!object.p.o) return;

  object.p.o.x = this.lerp(object.p.o.x, object.p.x, 0.2);
  object.p.o.y = this.lerp(object.p.o.y, object.p.y, 0.2);

  this.scene_objects[object.id].position.x = object.p.o.x;
  this.scene_objects[object.id].position.y = object.p.o.y;
}

TenchiRenderer.prototype.init = function() {
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
  
  // start render loop
  render_loop();
}

TenchiRenderer.prototype.draw = function() {
  // update camera
  if (this.scene_objects[this.engine.client_id]) {
    this.camera.target = this.scene_objects[this.engine.client_id]; // always point at player
    this.camera.position.x = Math.floor(this.scene_objects[this.engine.client_id].position.x);
    this.camera.position.y = Math.floor(this.scene_objects[this.engine.client_id].position.y);
  }

  this.renderer.render(this.scene, this.camera);
}

TenchiRenderer.prototype.entity_is = function(entity, flag) {
  return (entity.a & flag) == flag;
}

TenchiRenderer.prototype.lerp = function(a, b, t) {
  return ((1.0 - t) * a) + (t * b);
}

function render_loop() {
  requestAnimFrame(render_loop);
  tenchi_client.tenchi_engine.renderer.draw();
  stats.update();
}
