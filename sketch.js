// -----------------------------
// Global state
// -----------------------------
let zoom = 1;
let offsetX = 0;
let offsetZ = 0;

let angleX = Math.PI / 2;
let angleY = 0;

let isTouch = false;

// JSON roots (filled in preload)
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

// Icon cache for label types
let iconCache = {};

// -----------------------------
// Utility: multiply projection * modelview (column-major arrays)
// -----------------------------
function multMat4(a, b) {
  const out = new Array(16).fill(0);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[k * 4 + row] * b[col * 4 + k];
      }
      out[col * 4 + row] = sum;
    }
  }
  return out;
}

// -----------------------------
// Convert world (x,y,z) to screen pixels reliably (WEBGL)
// -----------------------------
function worldToScreen(x, y, z) {
  const renderer = (typeof this !== 'undefined' && this._renderer) ? this._renderer : (p5 && p5.instance && p5.instance._renderer ? p5.instance._renderer : null);
  if (!renderer || !renderer.uPMatrix || !renderer.uMVMatrix) {
    return { x: NaN, y: NaN, z: Infinity };
  }

  const pMat = renderer.uPMatrix.mat4;
  const mvMat = renderer.uMVMatrix.mat4;

  const mvp = multMat4(pMat, mvMat);

  const nx = mvp[0] * x + mvp[4] * y + mvp[8] * z + mvp[12];
  const ny = mvp[1] * x + mvp[5] * y + mvp[9] * z + mvp[13];
  const nz = mvp[2] * x + mvp[6] * y + mvp[10] * z + mvp[14];
  const nw = mvp[3] * x + mvp[7] * y + mvp[11] * z + mvp[15];

  if (!isFinite(nw) || Math.abs(nw) < 1e-8) {
    return { x: NaN, y: NaN, z: Infinity };
  }

  const ndcX = nx / nw;
  const ndcY = ny / nw;
  const ndcZ = nz / nw; // depth

  const sx = (ndcX * 0.5 + 0.5) * width;
  const sy = (-ndcY * 0.5 + 0.5) * height;

  return { x: sx, y: sy, z: ndcZ };
}

// -----------------------------
// Classes
// -----------------------------
class Point {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
}

class Detail {
  constructor(down_points, up_points) { this.down_points = down_points; this.up_points = up_points; }
}

class ExtendedDetail {
  constructor(points, clr) { this.points = points; this.clr = clr; }
}

class Area {
  constructor(name, points, r, g, b) { this.name = name; this.points = points; this.r = r; this.g = g; this.b = b; }
  show() {
    fill(this.r, this.g, this.b);
    beginShape();
    for (let p of this.points) vertex(p.x, p.y, p.z);
    endShape(CLOSE);
  }
}

class Area3D {
  constructor(address, name, details, r, g, b) { this.address = address; this.name = name; this.details = details; this.r = r; this.g = g; this.b = b; }
  show() {
    fill(this.r, this.g, this.b, 175);
    for (let det of this.details) {
      drawPolygon(det.down_points);
      drawPolygon(det.up_points);
      for (let i = 0; i < det.down_points.length; i++) {
        let p1 = det.down_points[i];
        let p2 = det.down_points[(i + 1) % det.down_points.length];
        let p3 = det.up_points[(i + 1) % det.up_points.length];
        let p4 = det.up_points[i];
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

function drawPolygon(points) {
  beginShape();
  for (let p of points) vertex(p.x, p.y, p.z);
  endShape(CLOSE);
}

class Label {
  constructor(address, name, type, level, location) {
    this.address = address;
    this.name = name;
    this.type = type;
    this.level = level;
    this.x = location.x;
    this.y = location.y;
    this.z = location.z;
    this.icon = null;
    this._screen = { x: 0, y: 0, visible: false };

    if (type) {
      if (iconCache[type]) {
        this.icon = iconCache[type];
      } else {
        try {
          this.icon = loadImage('data/' + type + '.png',
            img => { iconCache[type] = img; this.icon = img; },
            err => { console.warn('Label icon not found for type:', type); }
          );
        } catch (e) {
          console.warn('loadImage failed for label type', type, e);
        }
      }
    }
    this.clr = this.colorForType(type);
  }

  colorForType(type) {
    switch (type) {
      case "bar": case "fastfood": case "cafe": case "restaurant": return {r:224,g:129,b:58};
      case "church": case "flag": case "police": case "school": case "synagogue": case "post": case "factory": return {r:142,g:145,b:149};
      case "museum": case "landmark": case "theater": return {r:16,g:127,b:116};
      case "hospital": return {r:233,g:121,b:107};
      case "spa": return {r:225,g:116,b:155};
      case "pharmacy": return {r:13,g:160,b:0};
      case "business": case "office": case "barbershop": case "sports": case "hotel": case "bank": return {r:112,g:123,b:230};
      case "shop": case "supermarket": case "hypermarket": case "clothes": case "furniture": case "plants": case "zoo": return {r:12,g:127,b:170};
      case "station": return {r:255,g:255,b:255};
      case "park": case "stadium": return {r:59,g:156,b:88};
      case "metro": return {r:83,g:178,b:62};
      case "restaurant": return {r:255, g: 0, b: 0};
      case "school": return {r:0, g: 255, b: 0};
      case "hotel": return {r:0, g:0, b:255};
      case "bank": return {r:0, g:0, b:0};
      case "police": return {r:255, g:255, b:255};
      case "factory": return {r:125, g:125, b:125};
      case "airport": return {r:255, g:255, b:0};
      case "stadium": return {r:0, g:255, b:255};
      case "theater": return {r:255, g:0, b:255};
      case "university": return {r:128, g:128, b:128};
      case "gym": return {r:255, g:100, b:100};
      default: return {r:255,g:255,b:255};
    }
  }

  show() {
    push();
    translate(this.x, this.y, this.z);
    rotateY(-angleY);
    scale(1 / zoom);
    noStroke();
    fill(this.clr.r, this.clr.g, this.clr.b);
    textSize(17);
    textAlign(CENTER, TOP);
    if (this.icon && this.icon.width) {
      imageMode(CENTER);
      image(this.icon, 0, 0, this.icon.width / 1.5, this.icon.height / 1.5);
      text(this.name, 0, (this.icon.height / 1.5) - 6);
    } else {
      text(this.name, 0, -6);
    }
    pop();
  }
}

// -----------------------------
// preload - load JSON and icons mentioned in labels
// -----------------------------
function preload() {
  font = loadFont("data/YandexSansText-Medium.ttf");
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

  try {
    let arr = (json_labels_root && (json_labels_root.labels || json_labels_root)) || [];
    let types = {};
    for (let i = 0; i < arr.length; i++) {
      let t = arr[i].type;
      if (t && !types[t]) {
        types[t] = true;
        iconCache[t] = loadImage('data/' + t + '.png',
          img => { iconCache[t] = img; },
          err => { delete iconCache[t]; console.warn('Missing icon for type (expected):', 'data/' + t + '.png'); }
        );
      }
    }
  } catch (e) {
    console.warn('Failed to pre-load icons from labels.json', e);
  }
}

// -----------------------------
// setup
// -----------------------------
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  textFont(font);
  textSize(16);
  textAlign(CENTER, CENTER);
  // parse jsons into objects
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

// -----------------------------
// draw loop
// -----------------------------
function draw() {
  background(43, 52, 85);
  zoom = constrain(zoom, 0.2, 8.0);

  // -------------------------
  // 3D scene render
  // -------------------------
  push();
  translate(0, 100, 0);
  scale(zoom);
  rotateX(angleX);
  rotateY(angleY);
  translate(offsetX, 0, offsetZ);

  // compute screen positions for labels
  for (let L of labels) {
    const s = worldToScreen(L.x, L.y, L.z);
    L._screen.x = s.x;
    L._screen.y = s.y;
    L._screen.visible = isFinite(s.z) && s.z > -1 && s.z < 1;
  }

  // draw map layers
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

  pop(); 

  // -------------------------
  // 2D HUD render for labels (icons + text)
  // -------------------------
  push();
  resetMatrix();
  translate(-width / 2, -height / 2);

  if (drawingContext && drawingContext.disable) {
    try { drawingContext.disable(drawingContext.DEPTH_TEST); } catch (e) {}
  }

  for (let L of labels) {
    if (!L._screen || !L._screen.visible) continue;
    if (L.level > zoom) continue;

    let sx = L._screen.x;
    let sy = L._screen.y;

    if (!isFinite(sx) || !isFinite(sy)) continue;

    if (L.icon && L.icon.width) {
      let iw = L.icon.width / 1.5;
      let ih = L.icon.height / 1.5;
      imageMode(CORNER);
      image(L.icon, sx - iw / 2, sy - ih / 2, iw, ih);
      if (zoom >= 2) {
        fill(0, 160);
        textSize(17);
        text(L.name, sx + 1, sy + ih / 2 + 3 + 1);
        fill(L.clr.r, L.clr.g, L.clr.b);
        text(L.name, sx, sy + ih / 2 + 3);
      }
    } else {
      fill(L.clr.r, L.clr.g, L.clr.b);
      noStroke();
      ellipse(sx, sy, 10, 10);
      if (zoom >= 2) {
        fill(255);
        textSize(14);
        text(L.name, sx, sy + 8);
      }
    }
  }

  if (drawingContext && drawingContext.enable) {
    try { drawingContext.enable(drawingContext.DEPTH_TEST); } catch (e) {}
  }

  pop();
}

// -----------------------------
// draw layer helpers
// -----------------------------
function drawUnderlays() { for (let u of underlays) if (u && u.show) u.show(); }
function drawGreenAreas() { for (let g of green_areas) if (g && g.show) g.show(); }
function drawWaters() { for (let w of waters) if (w && w.show) w.show(); }
function drawParkings() { for (let p of parkings) if (p && p.show) p.show(); }
function drawAlleys() { for (let a of alleys) if (a && a.show) a.show(); }
function drawRailways() { for (let r of railways) if (r && r.show) r.show(); }
function drawRoads() { for (let r of roads) if (r && r.show) r.show(); }
function drawFields() { for (let f of fields) if (f && f.show) f.show(); }
function drawBuildings() { for (let b of buildings) if (b && b.show) b.show(); }
function drawDetalisedBuildings() { for (let d of detalised_buildings) if (d && d.show) d.show(); }
function drawHospitals() { for (let h of hospitals) if (h && h.show) h.show(); }
function drawGovernments() { for (let g of governments) if (g && g.show) g.show(); }

// -----------------------------
// JSON readers
// -----------------------------
function safeArr(root, key) {
  if (!root) return [];
  if (root[key]) return root[key];
  if (Array.isArray(root)) return root;
  for (let k in root) if (Array.isArray(root[k])) return root[k];
  return [];
}
