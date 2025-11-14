// sketch.js - полный перевод с Processing (Java / P3D) на p5.js (WEBGL)

// ----------------- Глобальные переменные и данные -----------------
let zoom = 1;

let offsetX = 0;
let offsetZ = 0;

let angleX = Math.PI / 2;
let angleY = 0;

// JSON roots (будут заполнены в preload)
let json_alleys, json_buildings, json_detalised_buildings;
let json_fields, json_governments, json_green_areas;
let json_hospitals, json_labels, json_parkings;
let json_railways, json_roads, json_underlays, json_waters;

// Списки объектов класса
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

// ----------------- Классы -----------------
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
    for (let i=0;i<this.points.length;i++){
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
    this.details = details; // array of Detail
    this.r = r; this.g = g; this.b = b;
  }
  show() {
    // alpha similar to Processing's 175
    fill(this.r, this.g, this.b, 175);
    for (let j=0;j<this.details.length;j++) {
      let det = this.details[j];
      drawPolygon(det.down_points);
      drawPolygon(det.up_points);
      // side quads (converted to 2 triangles)
      for (let i=0;i<det.down_points.length;i++) {
        let p1 = det.down_points[i];
        let p2 = det.down_points[(i+1) % det.down_points.length];
        let p3 = det.up_points[(i+1) % det.up_points.length];
        let p4 = det.up_points[i];

        // draw two triangles
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
    this.details = details; // ExtendedDetail[]
  }
  show() {
    for (let j=0;j<this.details.length;j++){
      let ed = this.details[j];
      let c = ed.clr;
      if (c && c.a !== undefined) fill(c.r,c.g,c.b,c.a); else fill(c.r,c.g,c.b);
      beginShape();
      for (let i=0;i<ed.points.length;i++){
        let p = ed.points[i];
        vertex(p.x,p.y,p.z);
      }
      endShape(CLOSE);
    }
  }
}

function drawPolygon(points) {
  beginShape();
  for (let i=0;i<points.length;i++){
    vertex(points[i].x, points[i].y, points[i].z);
  }
  endShape(CLOSE);
}

function drawPolyline(pts) {
  if (pts.length < 2) return;
  // Use LINES primitive: vertices should be pairs
  beginShape(LINES);
  for (let i=0;i<pts.length-1;i++){
    let p1 = pts[i];
    let p2 = pts[i+1];
    vertex(p1.x, p1.y-1, p1.z);
    vertex(p2.x, p2.y-1, p2.z);
  }
  endShape();
}

class Railway {
  constructor(points) { this.points = points; }
  show() {
    stroke(67,80,109);
    strokeWeight(1);
    drawPolyline(this.points);
    noStroke();
  }
}

class Building extends Area3D {
  constructor(address, name, details) { super(address, name, details, 55, 68, 91); }
}

class DetalisedBuilding extends DetalisedArea3D {
  constructor(address, name, details) { super(address, name, details); }
}

class Hospital extends Area3D {
  constructor(address, name, details) { super(address, name, details, 71, 66, 81); }
}

class Government extends Area3D {
  constructor(address, name, details) { super(address, name, details, 54, 64, 96); }
}

class GreenArea extends Area {
  constructor(name, points) { super(name, points, 28, 68, 64); }
}

class Field extends Area {
  constructor(address, name, points) { super(name, points, 42, 85, 80); }
}

class Water extends Area {
  constructor(name, points) { super(name, points, 0, 21, 97); }
}

class Road extends Area {
  constructor(name, points) { super(name, points, 83, 102, 143); }
}

class Parking extends Area {
  constructor(points) { super("", points, 38, 47, 66); }
}

class Underlay extends Area {
  constructor(points) { super("", points, 43, 52, 85); }
}

class Alley extends Area {
  constructor(name, points) { super(name, points, 68, 85, 125); }
}

class Label {
  constructor(address, name, type, level, location) {
    this.address = address;
    this.name = name;
    this.type = type;
    this.level = level;
    this.x = location.x; this.y = location.y; this.z = location.z;
    // load icon (may be async but p5 queues it)
    this.icon = null;
    this.iconPath = 'data/' + this.type + '.png';
    // try load image - if it fails you may want to preload icons (optional)
    try {
      this.icon = loadImage(this.iconPath, ()=>{}, ()=>{ /* fail silent */ });
    } catch (e) {
      this.icon = null;
    }
    // set color by type (imitate switch from Processing)
    this.clr = colorFromType(this.type);
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

    // 2D-like drawing anchored at (0,0,0)
    noStroke();
    // fill expects numbers; this.clr is {r,g,b}
    fill(this.clr.r, this.clr.g, this.clr.b);
    textSize(17);
    textAlign(CENTER, TOP);

    if (zoom >= 2) {
      // draw shadow text (multiple offsets) like original
      for (let dx = -0.25; dx <= 0.25; dx += 0.25) {
        for (let dy = -0.25; dy <= 0.25; dy += 0.25) {
          if (dx !== 0 || dy !== 0) {
            push();
            translate(dx, dy, 0);
            text(this.name, 0, (this.icon ? this.icon.height/1.5 : 0) - 15);
            pop();
          }
        }
      }
      text(this.name, 0, (this.icon ? this.icon.height/1.5 : 0) - 15);
    }

    if (this.icon) {
      // imageMode(CENTER) works in WEBGL
      push();
      imageMode(CENTER);
      // scale icon down similarly to Processing: /1.5
      let iw = this.icon.width / 1.5;
      let ih = this.icon.height / 1.5;
      image(this.icon, 0, 0, iw, ih);
      pop();
    }

    // enable depth test back
    if (drawingContext && drawingContext.enable) {
      drawingContext.enable(drawingContext.DEPTH_TEST);
    }

    scale(zoom);
    pop();
  }
}

// helper to mimic Processing switch -> color
function colorFromType(type) {
  switch(type) {
    case "bar":
    case "fastfood":
    case "cafe":
    case "restaurant":
      return {r:224,g:129,b:58};
    case "church":
    case "flag":
    case "police":
    case "school":
    case "synagogue":
    case "post":
    case "factory":
      return {r:142,g:145,b:149};
    case "museum":
    case "landmark":
    case "theater":
      return {r:16,g:127,b:116};
    case "hospital":
      return {r:233,g:121,b:107};
    case "spa":
      return {r:225,g:116,b:155};
    case "pharmacy":
      return {r:13,g:160,b:0};
    case "business":
    case "office":
    case "barbershop":
    case "sports":
    case "hotel":
    case "bank":
      return {r:112,g:123,b:230};
    case "shop":
    case "supermarket":
    case "hypermarket":
    case "clothes":
    case "furniture":
    case "plants":
    case "zoo":
      return {r:12,g:127,b:170};
    case "station":
      return {r:255,g:255,b:255};
    case "park":
    case "stadium":
      return {r:59,g:156,b:88};
    case "metro":
      return {r:83,g:178,b:62};
    default:
      return {r:255,g:255,b:255};
  }
}

// ----------------- Чтение JSON -> создание объектов -----------------
function read_json_alleys() {
  let arr = json_alleys.alleys || json_alleys;
  for (let i=0;i<arr.length;i++){
    let alley = arr[i];
    let name = alley.name;
    let json_points = alley.points;
    let points = [];
    for (let j=0;j<json_points.length;j++){
      let pt = json_points[j];
      points.push(new Point(pt[0], pt[1], pt[2]));
    }
    alleys.push(new Alley(name, points));
  }
}

function read_json_buildings() {
  let arr = json_buildings.buildings || json_buildings;
  for (let i=0;i<arr.length;i++){
    let b = arr[i];
    let address = b.address;
    let name = b.name;
    let json_details = b.details || [];
    let details = [];
    for (let j=0;j<json_details.length;j++){
      let detail = json_details[j];
      let json_down_points = detail.down_points || [];
      let json_up_points = detail.up_points || [];
      let down_points = [];
      for (let k=0;k<json_down_points.length;k++){
        let p = json_down_points[k];
        down_points.push(new Point(p[0], p[1] + 0.01, p[2]));
      }
      let up_points = [];
      for (let k=0;k<json_up_points.length;k++){
        let p = json_up_points[k];
        up_points.push(new Point(p[0], p[1], p[2]));
      }
      details.push(new Detail(down_points, up_points));
    }
    buildings.push(new Building(address, name, details));
  }
}

function read_json_detalised_buildings() {
  let arr = json_detalised_buildings.detalised_buildings || json_detalised_buildings;
  for (let i=0;i<arr.length;i++){
    let obj = arr[i];
    let address = obj.address;
    let name = obj.name;
    let json_details = obj.details || [];
    let details = [];
    for (let j=0;j<json_details.length;j++){
      let det = json_details[j];
      let json_points = det.points || [];
      let json_color = det.color || [100,100,100];
      let r = json_color[0], g = json_color[1], b = json_color[2];
      let clr = {r:r,g:g,b:b};
      let points = [];
      for (let k=0;k<json_points.length;k++){
        let p = json_points[k];
        points.push(new Point(p[0], p[1] + 0.01, p[2]));
      }
      details.push(new ExtendedDetail(points, clr));
    }
    detalised_buildings.push(new DetalisedBuilding(address, name, details));
  }
}

function read_json_fields() {
  let arr = json_fields.fields || json_fields;
  for (let i=0;i<arr.length;i++){
    let f = arr[i];
    let address = f.address;
    let name = f.name;
    let json_points = f.points || [];
    let points = [];
    for (let j=0;j<json_points.length;j++){
      let p = json_points[j];
      points.push(new Point(p[0], p[1], p[2]));
    }
    fields.push(new Field(address, name, points));
  }
}

function read_json_governments() {
  let arr = json_governments.governments || json_governments;
  for (let i=0;i<arr.length;i++){
    let g = arr[i];
    let address = g.address;
    let name = g.name;
    let json_details = g.details || [];
    let details = [];
    for (let j=0;j<json_details.length;j++){
      let detail = json_details[j];
      let json_down_points = detail.down_points || [];
      let json_up_points = detail.up_points || [];
      let down_points = [];
      for (let k=0;k<json_down_points.length;k++){
        let p = json_down_points[k];
        down_points.push(new Point(p[0], p[1] + 0.01, p[2]));
      }
      let up_points = [];
      for (let k=0;k<json_up_points.length;k++){
        let p = json_up_points[k];
        up_points.push(new Point(p[0], p[1], p[2]));
      }
      details.push(new Detail(down_points, up_points));
    }
    governments.push(new Government(address, name, details));
  }
}

function read_json_green_areas() {
  let arr = json_green_areas.green_areas || json_green_areas;
  for (let i=0;i<arr.length;i++){
    let ga = arr[i];
    let name = ga.name;
    let json_points = ga.points || [];
    let points = [];
    for (let j=0;j<json_points.length;j++){
      let p = json_points[j];
      points.push(new Point(p[0], p[1], p[2]));
    }
    green_areas.push(new GreenArea(name, points));
  }
}

function read_json_hospitals() {
  let arr = json_hospitals.hospitals || json_hospitals;
  for (let i=0;i<arr.length;i++){
    let h = arr[i];
    let address = h.address;
    let name = h.name;
    let json_details = h.details || [];
    let details = [];
    for (let j=0;j<json_details.length;j++){
      let detail = json_details[j];
      let json_down_points = detail.down_points || [];
      let json_up_points = detail.up_points || [];
      let down_points = [];
      for (let k=0;k<json_down_points.length;k++){
        let p = json_down_points[k];
        down_points.push(new Point(p[0], p[1] + 0.01, p[2]));
      }
      let up_points = [];
      for (let k=0;k<json_up_points.length;k++){
        let p = json_up_points[k];
        up_points.push(new Point(p[0], p[1], p[2]));
      }
      details.push(new Detail(down_points, up_points));
    }
    hospitals.push(new Hospital(address, name, details));
  }
}

function read_json_labels() {
  let arr = json_labels.labels || json_labels;
  for (let i=0;i<arr.length;i++){
    let lb = arr[i];
    let address = lb.address;
    let name = lb.name;
    let type = lb.type;
    let level = lb.level;
    let p = lb.point;
    let x = p[0], y = p[1], z = p[2];
    labels.push(new Label(address, name, type, level, new Point(x,y,z)));
  }
}

function read_json_parkings() {
  let arr = json_parkings.parkings || json_parkings;
  for (let i=0;i<arr.length;i++){
    let pk = arr[i];
    let json_points = pk.points || [];
    let points = [];
    for (let j=0;j<json_points.length;j++){
      let p = json_points[j];
      points.push(new Point(p[0], p[1], p[2]));
    }
    parkings.push(new Parking(points));
  }
}

function read_json_railways() {
  let arr = json_railways.railways || json_railways;
  for (let i=0;i<arr.length;i++){
    let r = arr[i];
    let json_points = r.points || [];
    let points = [];
    for (let j=0;j<json_points.length;j++){
      let p = json_points[j];
      // note slight Y offset as in Processing
      points.push(new Point(p[0], p[1]-0.006, p[2]));
    }
    railways.push(new Railway(points));
  }
}

function read_json_roads() {
  let arr = json_roads.roads || json_roads;
  for (let i=0;i<arr.length;i++){
    let r = arr[i];
    let name = r.name;
    let json_points = r.points || [];
    let points = [];
    for (let j=0;j<json_points.length;j++){
      let p = json_points[j];
      points.push(new Point(p[0], p[1]-0.005, p[2]));
    }
    roads.push(new Road(name, points));
  }
}

function read_json_underlays() {
  let arr = json_underlays.underlays || json_underlays;
  for (let i=0;i<arr.length;i++){
    let u = arr[i];
    let json_points = u.points || [];
    let points = [];
    for (let j=0;j<json_points.length;j++){
      let p = json_points[j];
      points.push(new Point(p[0], p[1], p[2]));
    }
    underlays.push(new Underlay(points));
  }
}

function read_json_waters() {
  let arr = json_waters.water || json_waters;
  for (let i=0;i<arr.length;i++){
    let w = arr[i];
    let name = w.name;
    let json_points = w.points || [];
    let points = [];
    for (let j=0;j<json_points.length;j++){
      let p = json_points[j];
      points.push(new Point(p[0], p[1]-0.01, p[2]));
    }
    waters.push(new Water(name, points));
  }
}

// ----------------- Функции рисования слоёв (как в оригинале) -----------------
function drawAlleys() { for (let a of alleys) a.show(); }
function drawBuildings() { for (let b of buildings) b.show(); }
function drawDetalisedBuildings() { for (let d of detalised_buildings) d.show(); }
function drawFields() { for (let f of fields) f.show(); }
function drawGovernments() { for (let g of governments) g.show(); }
function drawGreenAreas() { for (let g of green_areas) g.show(); }
function drawHospitals() { for (let h of hospitals) h.show(); }
function drawLabels() { for (let l of labels) if (l.level <= zoom) l.show(); }
function drawParkings() { for (let p of parkings) p.show(); }
function drawRailways() { for (let r of railways) r.show(); }
function drawRoads() { for (let r of roads) r.show(); }
function drawUnderlays() { for (let u of underlays) u.show(); }
function drawWaters() { for (let w of waters) w.show(); }

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
  // drawLabels();  // labels рисуем отдельно (в show() они сами управляют depth)
}

// ----------------- p5.js lifecycle: preload, setup, draw -----------------
function preload() {
  // загружаем JSON-ы синхронно
  // Если JSON имеет в корне массивы, как у тебя, код ниже адаптирует (см. read_json_*).
  json_alleys = loadJSON('data/alleys.json');
  json_buildings = loadJSON('data/buildings.json');
  json_detalised_buildings = loadJSON('data/detalised_buildings.json');
  json_fields = loadJSON('data/fields.json');
  json_governments = loadJSON('data/governments.json');
  json_green_areas = loadJSON('data/green_areas.json');
  json_hospitals = loadJSON('data/hospitals.json');
  json_labels = loadJSON('data/labels.json');
  json_parkings = loadJSON('data/parkings.json');
  json_railways = loadJSON('data/railways.json');
  json_roads = loadJSON('data/roads.json');
  json_underlays = loadJSON('data/underlays.json');
  json_waters = loadJSON('data/water.json');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();

  // читаем json и создаём объекты
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

function draw() {
  background(43, 52, 85);

  push();
  // В Processing ты делал translate(width/2, height/2 + 100, 0);
  // В p5 WEBGL центр уже (0,0). Чтобы получить похожее смещение — translate(0, 100, 0)
  translate(0, 100, 0);
  scale(zoom);
  rotateX(angleX);
  rotateY(angleY);
  translate(offsetX, 0, offsetZ);

  drawMap();

  // Labels: в оригинале были в draw() после трансформаций, с hint(DISABLE_DEPTH_TEST)
  // У нас show() у Label делает disable DEPTH_TEST и рисует иконку+текст.
  for (let l of labels) {
    if (l.level <= zoom) l.show();
  }

  pop();
}

// ----------------- Взаимодействие мыши -----------------
function mouseDragged() {
  let sensitivity = 1.0 / zoom;
  let deltaX = mouseX - pmouseX;
  let deltaY = mouseY - pmouseY;

  // проверка на Ctrl (как у тебя в Processing)
  // p5 предлагает keyIsDown(CONTROL)
  if (keyIsDown(CONTROL)) {
    angleY -= deltaX * 0.005;
    angleX -= deltaY * 0.005;
    // constrain like in Processing
    angleX = constrain(angleX, Math.PI/2, Math.PI/1.25);
  } else {
    let cosY = Math.cos(angleY);
    let sinY = Math.sin(angleY);
    offsetX += (deltaY * sinY + deltaX * cosY) * sensitivity;
    offsetZ -= (deltaY * cosY - deltaX * sinY) * sensitivity;
  }
}

// mouseWheel: event.deltaY (positive when scrolling down)
function mouseWheel(event) {
  let sensitivity = 1.0 / zoom;
  let zoomSpeed = 0.05;
  // Normalize scroll to sign similar to Processing event.getCount()
  // event.deltaY can be large; convert to -1..1 step
  let e = (event.deltaY > 0) ? 1 : -1;
  let oldZoom = zoom;
  zoom *= 1 - e * zoomSpeed;
  zoom = constrain(zoom, 0.1, 20.0);

  let deltaZoom = zoom - oldZoom;

  // Normalized mouse coordinates relative to center
  let normX = (mouseX - width / 2.0) / width;
  let normZ = (mouseY - height / 2.0) / height;

  // smoothing factor stronger for larger zoom
  let smoothingFactor = 1.0 / Math.pow(zoom, 1.5);

  let deltaX = -normX * deltaZoom * width * smoothingFactor;
  let deltaZ = -normZ * deltaZoom * height * smoothingFactor;

  // account for rotation
  let cosY = Math.cos(angleY);
  let sinY = Math.sin(angleY);
  offsetX += (deltaZ * sinY + deltaX * cosY) * sensitivity;
  offsetZ -= (deltaZ * cosY - deltaX * sinY) * sensitivity;

  // prevent page scrolling
  return false;
}

// ----------------- Обработчики окна -----------------
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ----------------- Добавочные утилиты/функции (чтение) -----------------
function safeArray(a) { return (Array.isArray(a) ? a : []); }

// ----------------- Конец кода -----------------

