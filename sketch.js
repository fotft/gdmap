// sketch.js — полный перевод Processing -> p5.js (WEBGL)
// Поместите рядом папку data/ с JSON'ами и иконками data/<type>.png

// =========================
// Global state
// =========================
let zoom = 1;
let offsetX = 0;
let offsetZ = 0;
let angleX = Math.PI / 2;
let angleY = 0;

// JSON roots
let json_alleys_root, json_buildings_root, json_detalised_buildings_root;
let json_fields_root, json_governments_root, json_green_areas_root;
let json_hospitals_root, json_labels_root, json_parkings_root;
let json_railways_root, json_roads_root, json_underlays_root, json_waters_root;

// arrays of objects
let alleys = [];
let buildings = [];
let detalised_buildings = [];
let fields = [];
let governments = [];
let green_areas = [];
let hospitals = [];
let labels = [];
let parkings = [];
let railways = [];
let roads = [];
let underlays = [];
let waters = [];

// =========================
// Classes (translated)
// =========================
class Point {
  constructor(x, y, z) {
    this.x = x; this.y = y; this.z = z;
  }
}

class Detail {
  constructor(down_points, up_points) {
    this.down_points = down_points;
    this.up_points = up_points;
  }
}

class ExtendedDetail {
  constructor(points, clr) {
    this.points = points;
    this.clr = clr; // {r,g,b,a?}
  }
}

class Area {
  constructor(name, points, r, g, b) {
    this.name = name;
    this.points = points;
    this.r = r; this.g = g; this.b = b;
  }
  show() {
    fill(this.r, this.g, this.b);
    beginShape();
    for (let i = 0; i < this.points.length; i++) {
      let p = this.points[i];
      vertex(p.x, p.y, p.z);
    }
    endShape(CLOSE);
  }
}

class Area3D {
  constructor(address, name, details, r, g, b) {
    this.address = address;
    this.name = name;
    this.details = details;
    this.r = r; this.g = g; this.b = b;
  }
  show() {
    // alpha similar to Processing's 175
    fill(this.r, this.g, this.b, 175);
    for (let j = 0; j < this.details.length; j++) {
      let det = this.details[j];
      drawPolygon(det.down_points);
      drawPolygon(det.up_points);
      for (let i = 0; i < det.down_points.length; i++) {
        let p1 = det.down_points[i];
        let p2 = det.down_points[(i + 1) % det.down_points.length];
        let p3 = det.up_points[(i + 1) % det.up_points.length];
        let p4 = det.up_points[i];

        // QUAD -> two triangles
        beginShape(TRIANGLES);
        vertex(p1.x, p1.y, p1.z);
        vertex(p2.x, p2.y, p2.z);
        vertex(p3.x, p3.y, p3.z);

        vertex(p1.x, p1.y, p1.z);
        vertex(p3.x, p3.y, p3.z);
        vertex(p4.x, p4.y, p4.z);
        endShape();
      }
    }
  }
}

class DetalisedArea3D {
  constructor(address, name, details) {
    this.address = address;
    this.name = name;
    this.details = details;
  }
  show() {
    for (let j = 0; j < this.details.length; j++) {
      let ed = this.details[j];
      let c = ed.clr;
      if (c && c.a !== undefined) fill(c.r, c.g, c.b, c.a);
      else fill(c.r, c.g, c.b);
      beginShape();
      for (let i = 0; i < ed.points.length; i++) {
        let p = ed.points[i];
        vertex(p.x, p.y, p.z);
      }
      endShape(CLOSE);
    }
  }
}

function drawPolygon(points) {
  beginShape();
  for (let i = 0; i < points.length; i++) {
    let p = points[i];
    vertex(p.x, p.y, p.z);
  }
  endShape(CLOSE);
}

function drawPolyline(pts) {
  if (!pts || pts.length < 2) return;
  // We'll draw as lines pairs
  strokeWeight(1);
  beginShape(LINES);
  for (let i = 0; i < pts.length - 1; i++) {
    let p1 = pts[i];
    let p2 = pts[i + 1];
    vertex(p1.x, p1.y - 1, p1.z);
    vertex(p2.x, p2.y - 1, p2.z);
  }
  endShape();
  noStroke();
}

class Railway {
  constructor(points) {
    this.points = points;
  }
  show() {
    stroke(67, 80, 109);
    strokeWeight(1);
    drawPolyline(this.points);
    noStroke();
  }
}

class Building extends Area3D { constructor(address, name, details) { super(address, name, details, 55, 68, 91); } }
class DetalisedBuilding extends DetalisedArea3D { constructor(address, name, details) { super(address, name, details); } }
class Hospital extends Area3D { constructor(address, name, details) { super(address, name, details, 71, 66, 81); } }
class Government extends Area3D { constructor(address, name, details) { super(address, name, details, 54, 64, 96); } }
class GreenArea extends Area { constructor(name, points) { super(name, points, 28, 68, 64); } }
class Field extends Area { constructor(address, name, points) { super(name, points, 42, 85, 80); } }
class Water extends Area { constructor(name, points) { super(name, points, 0, 21, 97); } }
class Road extends Area { constructor(name, points) { super(name, points, 83, 102, 143); } }
class Parking extends Area { constructor(points) { super("", points, 38, 47, 66); } }
class Underlay extends Area { constructor(points) { super("", points, 43, 52, 85); } }
class Alley extends Area { constructor(name, points) { super(name, points, 68, 85, 125); } }

// Label class: render icon and text in 3D, disable depth test while drawing
class Label {
  constructor(address, name, type, level, location) {
    this.address = address;
    this.name = name;
    this.type = type;
    this.level = level;
    this.x = location.x; this.y = location.y; this.z = location.z;
    this.icon = null;
    this.iconPath = 'data/' + this.type + '.png';
    // Attempt to load icon (p5 caches so multiple loads use cache)
    try {
      this.icon = loadImage(this.iconPath, () => {}, () => { /* ignore missing */ });
    } catch (e) {
      this.icon = null;
    }
    this.clr = this.colorForType(this.type);
  }

  colorForType(type) {
    switch (type) {
      case "bar": case "fastfood": case "cafe": case "restaurant": return { r:224,g:129,b:58 };
      case "church": case "flag": case "police": case "school": case "synagogue": case "post": case "factory": return { r:142,g:145,b:149 };
      case "museum": case "landmark": case "theater": return { r:16,g:127,b:116 };
      case "hospital": return { r:233,g:121,b:107 };
      case "spa": return { r:225,g:116,b:155 };
      case "pharmacy": return { r:13,g:160,b:0 };
      case "business": case "office": case "barbershop": case "sports": case "hotel": case "bank": return { r:112,g:123,b:230 };
      case "shop": case "supermarket": case "hypermarket": case "clothes": case "furniture": case "plants": case "zoo": return { r:12,g:127,b:170 };
      case "station": return { r:255,g:255,b:255 };
      case "park": case "stadium": return { r:59,g:156,b:88 };
      case "metro": return { r:83,g:178,b:62 };
      default: return { r:255,g:255,b:255 };
    }
  }

  show() {
    push();
    translate(this.x, this.y, this.z);
    rotateY(-angleY);
    rotateX(-angleX);
    scale(1/zoom);

    // disable depth test (like hint(DISABLE_DEPTH_TEST))
    if (drawingContext && drawingContext.disable) {
      drawingContext.disable(drawingContext.DEPTH_TEST);
    }

    fill(this.clr.r, this.clr.g, this.clr.b);
    textSize(17);
    textAlign(CENTER, TOP);

    if (zoom >= 2) {
      for (let dx = -0.25; dx <= 0.25; dx += 0.25) {
        for (let dy = -0.25; dy <= 0.25; dy += 0.25) {
          if (dx !== 0 || dy !== 0) {
            push();
            translate(dx, dy, 0);
            if (this.icon) text(this.name, 0, this.icon.height - 15);
            else text(this.name, 0, -15);
            pop();
          }
        }
      }
      if (this.icon) text(this.name, 0, this.icon.height - 15);
      else text(this.name, 0, -15);
    }

    if (this.icon) {
      imageMode(CENTER);
      image(this.icon, 0, 0, this.icon.width / 1.5, this.icon.height / 1.5);
    }

    // enable depth test back
    if (drawingContext && drawingContext.enable) {
      drawingContext.enable(drawingContext.DEPTH_TEST);
    }

    scale(zoom);
    pop();
  }
}

// =========================
// JSON loading + parsing
// =========================

function preload() {
  // load JSON files from data/
  json_alleys_root = loadJSON('data/alleys.json');
  json_buildings_root = loadJSON('data/buildings.json');
  json_detalised_buildings_root = loadJSON('data/detalised_buildings.json');
  json_fields_root = loadJSON('data/fields.json');
  json_governments_root = loadJSON('data/governments.json');
  json_green_areas_root = loadJSON('data/green_areas.json');
  json_hospitals_root = loadJSON('data/hospitals.json');
  json_labels_root = loadJSON('data/labels.json');
  json_parkings_root = loadJSON('data/parkings.json');
  json_railways_root = loadJSON('data/railways.json');
  json_roads_root = loadJSON('data/roads.json');
  json_underlays_root = loadJSON('data/underlays.json');
  json_waters_root = loadJSON('data/water.json');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  // read json and populate arrays
  read_json_alleys();
  read_json_buildings();
  read_json_detalised_buildings();
  read_json_fields();
  read_json_governments();
  read_json_green_areas();
  read_json_hospitals();
  read_json_labels();
  read_json_parkings();
  read_json_railways();
  read_json_roads();
  read_json_underlays();
  read_json_waters();
}

// =========================
// Draw functions (layers)
// =========================
function drawUnderlays() { for (let u of underlays) u.show(); }
function drawGreenAreas() { for (let g of green_areas) g.show(); }
function drawWaters() { for (let w of waters) w.show(); }
function drawParkings() { for (let p of parkings) p.show(); }
function drawAlleys() { for (let a of alleys) a.show(); }
function drawRailways() { for (let r of railways) r.show(); }
function drawRoads() { for (let r of roads) r.show(); }
function drawFields() { for (let f of fields) f.show(); }
function drawBuildings() { for (let b of buildings) b.show(); }
function drawDetalisedBuildings() { for (let d of detalised_buildings) d.show(); }
function drawHospitals() { for (let h of hospitals) h.show(); }
function drawGovernments() { for (let g of governments) g.show(); }

function drawMap() {
  drawUnderlays();
  drawGreenAreas();
  drawWaters();
  drawParkings();
  drawAlleys();
  drawRailways();
  drawRoads();
  drawFields();
  drawBuildings();
  drawDetalisedBuildings();
  drawHospitals();
  drawGovernments();
  // drawLabels handled separately where necessary
}

// =========================
// JSON readers
// =========================

function read_json_alleys() {
  if (!json_alleys_root) return;
  const arr = json_alleys_root.alleys || json_alleys_root;
  for (let i = 0; i < arr.length; i++) {
    let alley = arr[i];
    let name = alley.name || "";
    let json_points = alley.points || [];
    let points = [];
    for (let j = 0; j < json_points.length; j++) {
      let point = json_points[j];
      points.push(new Point(point[0], point[1], point[2]));
    }
    alleys.push(new Alley(name, points));
  }
}

function read_json_buildings() {
  if (!json_buildings_root) return;
  const arr = json_buildings_root.buildings || json_buildings_root;
  for (let i = 0; i < arr.length; i++) {
    let building = arr[i];
    let address = building.address || "";
    let name = building.name || "";
    let json_details = building.details || [];
    let details = [];
    for (let j = 0; j < json_details.length; j++) {
      let detail = json_details[j];
      let json_down_points = detail.down_points || [];
      let json_up_points = detail.up_points || [];
      let down_points = [];
      for (let k = 0; k < json_down_points.length; k++) {
        let pt = json_down_points[k];
        down_points.push(new Point(pt[0], pt[1] + 0.01, pt[2]));
      }
      let up_points = [];
      for (let k = 0; k < json_up_points.length; k++) {
        let pt = json_up_points[k];
        up_points.push(new Point(pt[0], pt[1], pt[2]));
      }
      details.push(new Detail(down_points, up_points));
    }
    buildings.push(new Building(address, name, details));
  }
}

function read_json_detalised_buildings() {
  if (!json_detalised_buildings_root) return;
  const arr = json_detalised_buildings_root.detalised_buildings || json_detalised_buildings_root;
  for (let i = 0; i < arr.length; i++) {
    let db = arr[i];
    let address = db.address || "";
    let name = db.name || "";
    let json_details = db.details || [];
    let details = [];
    for (let j = 0; j < json_details.length; j++) {
      let det = json_details[j];
      let json_points = det.points || [];
      let json_color = det.color || [100,100,100];
      let r = json_color[0], g = json_color[1], b = json_color[2];
      let clr = { r:r, g:g, b:b };
      let points = [];
      for (let k = 0; k < json_points.length; k++) {
        let p = json_points[k];
        points.push(new Point(p[0], p[1] + 0.01, p[2]));
      }
      details.push(new ExtendedDetail(points, clr));
    }
    detalised_buildings.push(new DetalisedBuilding(address, name, details));
  }
}

function read_json_fields() {
  if (!json_fields_root) return;
  const arr = json_fields_root.fields || json_fields_root;
  for (let i = 0; i < arr.length; i++) {
    let f = arr[i];
    let address = f.address || "";
    let name = f.name || "";
    let json_points = f.points || [];
    let points = [];
    for (let j = 0; j < json_points.length; j++) {
      let p = json_points[j];
      points.push(new Point(p[0], p[1], p[2]));
    }
    fields.push(new Field(address, name, points));
  }
}

function read_json_governments() {
  if (!json_governments_root) return;
  const arr = json_governments_root.governments || json_governments_root;
  for (let i = 0; i < arr.length; i++) {
    let g = arr[i];
    let address = g.address || "";
    let name = g.name || "";
    let json_details = g.details || [];
    let details = [];
    for (let j = 0; j < json_details.length; j++) {
      let detail = json_details[j];
      let json_down_points = detail.down_points || [];
      let json_up_points = detail.up_points || [];
      let down_points = [];
      for (let k = 0; k < json_down_points.length; k++) {
        let p = json_down_points[k];
        down_points.push(new Point(p[0], p[1] + 0.01, p[2]));
      }
      let up_points = [];
      for (let k = 0; k < json_up_points.length; k++) {
        let p = json_up_points[k];
        up_points.push(new Point(p[0], p[1], p[2]));
      }
      details.push(new Detail(down_points, up_points));
    }
    governments.push(new Government(address, name, details));
  }
}

function read_json_green_areas() {
  if (!json_green_areas_root) return;
  const arr = json_green_areas_root.green_areas || json_green_areas_root;
  for (let i = 0; i < arr.length; i++) {
    let ga = arr[i];
    let name = ga.name || "";
    let json_points = ga.points || [];
    let points = [];
    for (let j = 0; j < json_points.length; j++) {
      let p = json_points[j];
      points.push(new Point(p[0], p[1], p[2]));
    }
    green_areas.push(new GreenArea(name, points));
  }
}

function read_json_hospitals() {
  if (!json_hospitals_root) return;
  const arr = json_hospitals_root.hospitals || json_hospitals_root;
  for (let i = 0; i < arr.length; i++) {
    let h = arr[i];
    let address = h.address || "";
    let name = h.name || "";
    let json_details = h.details || [];
    let details = [];
    for (let j = 0; j < json_details.length; j++) {
      let detail = json_details[j];
      let json_down_points = detail.down_points || [];
      let json_up_points = detail.up_points || [];
      let down_points = [];
      for (let k = 0; k < json_down_points.length; k++) {
        let p = json_down_points[k];
        down_points.push(new Point(p[0], p[1] + 0.01, p[2]));
      }
      let up_points = [];
      for (let k = 0; k < json_up_points.length; k++) {
        let p = json_up_points[k];
        up_points.push(new Point(p[0], p[1], p[2]));
      }
      details.push(new Detail(down_points, up_points));
    }
    hospitals.push(new Hospital(address, name, details));
  }
}

function read_json_labels() {
  if (!json_labels_root) return;
  const arr = json_labels_root.labels || json_labels_root;
  for (let i = 0; i < arr.length; i++) {
    let label = arr[i];
    let address = label.address || "";
    let name = label.name || "";
    let type = label.type || "";
    let level = label.level || 0;
    let json_point = label.point || [0,0,0];
    let x = json_point[0], y = json_point[1], z = json_point[2];
    labels.push(new Label(address, name, type, level, new Point(x,y,z)));
  }
}

function read_json_parkings() {
  if (!json_parkings_root) return;
  const arr = json_parkings_root.parkings || json_parkings_root;
  for (let i = 0; i < arr.length; i++) {
    let pk = arr[i];
    let json_points = pk.points || [];
    let points = [];
    for (let j = 0; j < json_points.length; j++) {
      let p = json_points[j];
      points.push(new Point(p[0], p[1], p[2]));
    }
    parkings.push(new Parking(points));
  }
}

function read_json_railways() {
  if (!json_railways_root) return;
  const arr = json_railways_root.railways || json_railways_root;
  for (let i = 0; i < arr.length; i++) {
    let rail = arr[i];
    let json_points = rail.points || [];
    let points = [];
    for (let j = 0; j < json_points.length; j++) {
      let p = json_points[j];
      points.push(new Point(p[0], p[1] - 0.006, p[2]));
    }
    railways.push(new Railway(points));
  }
}

function read_json_roads() {
  if (!json_roads_root) return;
  const arr = json_roads_root.roads || json_roads_root;
  for (let i = 0; i < arr.length; i++) {
    let r = arr[i];
    let name = r.name || "";
    let json_points = r.points || [];
    let points = [];
    for (let j = 0; j < json_points.length; j++) {
      let p = json_points[j];
      points.push(new Point(p[0], p[1] - 0.005, p[2]));
    }
    roads.push(new Road(name, points));
  }
}

function read_json_underlays() {
  if (!json_underlays_root) return;
  const arr = json_underlays_root.underlays || json_underlays_root;
  for (let i = 0; i < arr.length; i++) {
    let u = arr[i];
    let json_points = u.points || [];
    let points = [];
    for (let j = 0; j < json_points.length; j++) {
      let p = json_points[j];
      points.push(new Point(p[0], p[1], p[2]));
    }
    underlays.push(new Underlay(points));
  }
}

function read_json_waters() {
  if (!json_waters_root) return;
  // some files use "water" as root key
  const arr = json_waters_root.water || json_waters_root;
  for (let i = 0; i < arr.length; i++) {
    let w = arr[i];
    let name = w.name || "";
    let json_points = w.points || [];
    let points = [];
    for (let j = 0; j < json_points.length; j++) {
      let p = json_points[j];
      points.push(new Point(p[0], p[1] - 0.01, p[2]));
    }
    waters.push(new Water(name, points));
  }
}

// =========================
// Main draw / interactions
// =========================

function draw() {
  background(43, 52, 85);
  push();
  // In Processing you had translate(width/2, height/2 + 100, 0);
  // In p5 WEBGL center is (0,0), so translate to approximate same view
  translate(0, 100, 0);
  scale(zoom);
  rotateX(angleX);
  rotateY(angleY);
  translate(offsetX, 0, offsetZ);

  drawMap();

  // draw labels last — they themselves disable depth test when drawing
  for (let i = 0; i < labels.length; i++) {
    if (labels[i].level <= zoom) labels[i].show();
  }

  pop();
}

// =========================
// Mouse / touch controls
// =========================

// Desktop: left drag = rotate, SHIFT + left drag = pan
let mousePanMode = false;
function mousePressed() {
  // We'll use SHIFT + left mouse for pan (user requested replacing ctrl+mouse with 2-finger; SHIFT is desktop-pan alternative)
  if (mouseButton === LEFT && keyIsDown(SHIFT)) {
    mousePanMode = true;
  }
}

function mouseReleased() {
  mousePanMode = false;
}

function mouseDragged() {
  let sensitivity = 1.0 / zoom;
  let deltaX = mouseX - pmouseX;
  let deltaY = mouseY - pmouseY;

  if (mousePanMode) {
    // pan: move offsets according to camera rotation (similar to Processing)
    let cosY = Math.cos(angleY);
    let sinY = Math.sin(angleY);
    offsetX += (deltaY * sinY + deltaX * cosY) * sensitivity;
    offsetZ -= (deltaY * cosY - deltaX * sinY) * sensitivity;
  } else {
    // rotate
    angleY -= deltaX * 0.005;
    angleX -= deltaY * 0.005;
    angleX = constrain(angleX, Math.PI / 2, Math.PI / 1.25);
  }
}

// mouseWheel: zoom; also supports touchpad two-finger scroll
function mouseWheel(event) {
  // event.deltaY positive when scrolling down; map to similar Processing behavior
  let sensitivity = 1.0 / zoom;
  let zoomSpeed = 0.05;
  let e = (event.deltaY > 0) ? 1 : -1;
  let oldZoom = zoom;
  zoom *= 1 - e * zoomSpeed;
  zoom = constrain(zoom, 0.1, 20.0);
  let deltaZoom = zoom - oldZoom;

  // normalized mouse coords relative to center
  let normX = (mouseX - width / 2.0) / width;
  let normZ = (mouseY - height / 2.0) / height;
  let smoothingFactor = 1.0 / Math.pow(zoom, 1.5);
  let deltaX = -normX * deltaZoom * width * smoothingFactor;
  let deltaZ = -normZ * deltaZoom * height * smoothingFactor;
  let cosY = Math.cos(angleY);
  let sinY = Math.sin(angleY);
  offsetX += (deltaZ * sinY + deltaX * cosY) * sensitivity;
  offsetZ -= (deltaZ * cosY - deltaX * sinY) * sensitivity;

  // Prevent default page scrolling on touchpads
  return false;
}

// =========================
// Mobile touch gestures (pinch zoom + two-finger pan; one finger rotate)
// =========================
let touchMode = "none";
let startDist = 0;
let startZoom = 1;
let lastPanX = 0;
let lastPanZ = 0;
let startOffsetX = 0;
let startOffsetZ = 0;

function touchStarted() {
  if (touches.length === 1) {
    touchMode = "rotate";
  } else if (touches.length === 2) {
    touchMode = "panzoom";
    startDist = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
    startZoom = zoom;
    lastPanX = (touches[0].x + touches[1].x) / 2;
    lastPanZ = (touches[0].y + touches[1].y) / 2;
    startOffsetX = offsetX;
    startOffsetZ = offsetZ;
  }
  return false; // prevent page scroll
}

function touchMoved() {
  if (touchMode === "rotate" && touches.length === 1) {
    // rotate based on movement
    angleY -= movedX * 0.005;
    angleX -= movedY * 0.005;
    angleX = constrain(angleX, Math.PI / 2, Math.PI / 1.25);
  } else if (touchMode === "panzoom" && touches.length === 2) {
    // pinch
    let d = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
    zoom = startZoom * (d / startDist);
    zoom = constrain(zoom, 0.1, 20.0);

    // pan by midpoint movement
    let cx = (touches[0].x + touches[1].x) / 2;
    let cz = (touches[0].y + touches[1].y) / 2;
    let dx = cx - lastPanX;
    let dz = cz - lastPanZ;
    // Convert screen drag to world offsets roughly (sensitivity tuned)
    let sensitivity = 1.0 / zoom;
    let cosY = Math.cos(angleY);
    let sinY = Math.sin(angleY);
    offsetX = startOffsetX + (dz * sinY + dx * cosY) * sensitivity * 0.7;
    offsetZ = startOffsetZ - (dz * cosY - dx * sinY) * sensitivity * 0.7;
  }
  return false;
}

function touchEnded() {
  if (touches.length === 0) touchMode = "none";
  return false;
}

// =========================
// window resize
// =========================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// =========================
// End of file
// =========================
