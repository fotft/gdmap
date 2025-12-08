// grdkmap.js — p5.js версия (2025)



class Detail {
  constructor(down_points, up_points) {
    this.down_points = down_points;
    this.up_points = up_points;
  }
}

class ExtendedDetail {
  constructor(down_points, up_points, lclr, dclr) {
    this.down_points = down_points;
    this.up_points = up_points;
    this.lclr = lclr;
    this.dclr = dclr;
  }
}

class Area {
  constructor(name, points, r, g, b) {
    this.name = name;
    this.points = points;
    this.r = r;
    this.g = g;
    this.b = b;
  }

  show() {
    fill(this.r, this.g, this.b);
    drawPolygon(this.points);
  }
}

class Area3D {
  constructor(address, name, details, r, g, b) {
    this.address = address;
    this.name = name;
    this.details = details;
    this.r = r;
    this.g = g;
    this.b = b;
  }

  show() {
    let isHovered = (this === hoveredArea3D);
    let isSelected = (this === selectedArea3D);
    if (isSelected) {
      fill(100, 150, 255, 220);
    } else if (isHovered) {
      fill((this.r + 75) / 2, (this.g + 100) / 2, (this.b + 169) / 2, 120);
    } else {
      fill(this.r, this.g, this.b, 175);
    }
    for (let j = 0; j < this.details.length; j++) {
      drawPolygon(this.details[j].down_points);
      drawPolygon(this.details[j].up_points);
      for (let i = 0; i < this.details[j].down_points.length; i++) {
        let p1 = this.details[j].down_points[i];
        let p2 = this.details[j].down_points[(i + 1) % this.details[j].down_points.length];
        let p3 = this.details[j].up_points[(i + 1) % this.details[j].up_points.length];
        let p4 = this.details[j].up_points[i];
        beginShape(QUADS);
        vertex(p1.x, p1.y + 0.01, p1.z);
        vertex(p2.x, p2.y + 0.01, p2.z);
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
      fill(theme === "dark" ? this.details[j].dclr : this.details[j].lclr);
      drawPolygon(this.details[j].down_points);
      drawPolygon(this.details[j].up_points);
      for (let i = 0; i < this.details[j].down_points.length; i++) {
        let p1 = this.details[j].down_points[i];
        let p2 = this.details[j].down_points[(i + 1) % this.details[j].down_points.length];
        let p3 = this.details[j].up_points[(i + 1) % this.details[j].up_points.length];
        let p4 = this.details[j].up_points[i];
        beginShape(QUADS);
        vertex(p1.x, p1.y + 0.01, p1.z);
        vertex(p2.x, p2.y + 0.01, p2.z);
        vertex(p3.x, p3.y, p3.z);
        vertex(p4.x, p4.y, p4.z);
        endShape();
      }
    }
  }
}

class Railway {
  constructor(points) {
    this.points = points;
    this.segmentLength = 15.0;
  }

  show() {
    let totalLength = this.calculateTotalLength();
    let distance = 0;
    while (distance < totalLength) {
      let start = this.getPointAtDistance(distance);
      let end = this.getPointAtDistance(distance + this.segmentLength);
      strokeWeight(sqrt(zoom) / zoom * 2);
      if ((distance / (2 * this.segmentLength)) % 1 < 0.5) {
        if (theme === "dark") stroke(97, 114, 154);
        else stroke(200, 210, 210);
      } else {
        if (theme === "dark") stroke(67, 80, 109);
        else stroke(152, 176, 176);
      }
      line(start.x, start.y - 1, start.z, end.x, end.y - 1, end.z);
      distance += this.segmentLength;
    }
    noStroke();
  }

  calculateTotalLength() {
    let length = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      length += p5.Vector.dist(this.points[i], this.points[i + 1]);
    }
    return length;
  }

  getPointAtDistance(distance) {
    let remaining = distance;
    for (let i = 0; i < this.points.length - 1; i++) {
      let p1 = this.points[i];
      let p2 = this.points[i + 1];
      let segmentDist = p5.Vector.dist(p1, p2);
      if (remaining <= segmentDist) {
        let t = remaining / segmentDist;
        return p5.Vector.lerp(p1, p2, t);
      }
      remaining -= segmentDist;
    }
    return this.points[this.points.length - 1];
  }
}

class Road extends Area {
  constructor(name, points) {
    super(name, points, colors.road[0], colors.road[1], colors.road[2]);
  }

  show() {
    super.show();
    if (zoom >= 1.5 && this.name && this.name.length > 0) {
      this.drawRoadLabel();
    }
  }

  drawRoadLabel() {
    if (frameCount !== lastFrameChecked) {
      currentFrameLabels = [];
      lastFrameChecked = frameCount;
    }

    let bestP1 = null;
    let bestP2 = null;
    let maxScreenDist = 0;

    let n = this.points.length;
    for (let i = 0; i < n; i++) {
      let p1 = this.points[i];
      let p2 = this.points[(i + 1) % n];

      let mid = p5.Vector.add(p1, p2).mult(0.5);
      if (!isPointVisible(mid)) continue;

      let sx1 = screenX(p1.x, p1.y, p1.z);
      let sy1 = screenY(p1.x, p1.y, p1.z);
      let sx2 = screenX(p2.x, p2.y, p2.z);
      let sy2 = screenY(p2.x, p2.y, p2.z);

      if ((sx1 < 0 && sx2 < 0) || (sx1 > width && sx2 > width)) continue;
      if ((sy1 < 0 && sy2 < 0) || (sy1 > height && sy2 > height)) continue;

      let distScreen = dist(sx1, sy1, sx2, sy2);
      if (distScreen > maxScreenDist) {
        maxScreenDist = distScreen;
        bestP1 = p1;
        bestP2 = p2;
      }
    }

    if (bestP1 === null || maxScreenDist < 60) return;

    let pA = bestP1;
    let pB = bestP2;

    let sxA = screenX(pA.x, pA.y, pA.z);
    let sxB = screenX(pB.x, pB.y, pB.z);

    if (sxA > sxB) {
      [pA, pB] = [pB, pA];
    }

    let segmentDir = p5.Vector.sub(pB, pA);
    let angle = -atan2(segmentDir.z, segmentDir.x);

    let segmentEdgeMid = p5.Vector.add(pA, pB).mult(0.5);
    let normal = createVector(-segmentDir.z, 0, segmentDir.x).normalize();

    let testPoint = p5.Vector.add(segmentEdgeMid, normal.mult(0.1));
    if (!this.isPointInsidePolygonXZ(testPoint)) {
      normal.mult(-1);
    }

    let oppositePoint = this.findRayIntersection(segmentEdgeMid, normal);

    let textPos;
    if (oppositePoint !== null) {
      textPos = p5.Vector.add(segmentEdgeMid, oppositePoint).mult(0.5);
    } else {
      textPos = p5.Vector.add(segmentEdgeMid, normal.mult(4.0));
    }
    textPos.y += 0.5;

    let screenXPos = screenX(textPos.x, textPos.y, textPos.z);
    let screenYPos = screenY(textPos.y, textPos.y, textPos.z);

    textFont(font);
    textSize(17);
    let txtW = textWidth(this.name);
    let txtH = 20;

    for (let l of labels) {
      if (!isPointVisible(l.location) || l.level > zoom) continue;
      let lx = screenX(l.location.x, l.location.y, l.location.z);
      let ly = screenY(l.location.x, l.location.y, l.location.z);
      if (abs(screenXPos - lx) < (txtW / 2 + 25) && abs(screenYPos - ly) < (txtH / 2 + 25)) return;
    }

    for (let rect of currentFrameLabels) {
      if (abs(screenXPos - rect[0]) < (txtW / 2 + rect[2] / 2) && abs(screenYPos - rect[1]) < (txtH / 2 + rect[3] / 2)) return;
    }

    push();
    translate(textPos.x, textPos.y, textPos.z);
    scale(1 / zoom);
    rotateY(angle);
    rotateX(PI / 2);
    scale(1, -1, 1);
    textAlign(CENTER, CENTER);
    if (theme === "dark") fill(40, 40, 40, 125); else fill(215, 215, 215, 125);
    for (let r = 0; r < TWO_PI; r += 3 / 2) {
      let dx = cos(r) * 2;
      let dy = sin(r) * 2;
      text(this.name, dx, dy);
    }
    if (theme === "dark") fill(220, 220, 220, 230);
    else fill(50, 50, 50, 230);
    text(this.name, 0, 0);
    pop();

    currentFrameLabels.push([screenXPos, screenYPos, txtW, txtH]);
  }

  isPointInsidePolygonXZ(p) {
    let inside = false;
    let n = this.points.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      let pi = this.points[i];
      let pj = this.points[j];
      if (((pi.z > p.z) !== (pj.z > p.z)) &&
          (p.x < (pj.x - pi.x) * (p.z - pi.z) / (pj.z - pi.z) + pi.x)) {
        inside = !inside;
      }
    }
    return inside;
  }

  findRayIntersection(origin, dir) {
    let closestIntersection = null;
    let minDistSq = Infinity;
    let n = this.points.length;
    for (let i = 0; i < n; i++) {
      let p1 = this.points[i];
      let p2 = this.points[(i + 1) % n];

      if (p5.Vector.dist(origin, p1) < 0.1 || p5.Vector.dist(origin, p2) < 0.1) continue;

      let intersection = getLineIntersectionXZ(origin, p5.Vector.add(origin, dir.mult(1000)), p1, p2);

      if (intersection !== null) {
        let dSq = p5.Vector.distSquared(origin, intersection);
        if (dSq > 0.1 && dSq < minDistSq) {
          minDistSq = dSq;
          closestIntersection = intersection;
        }
      }
    }
    return closestIntersection;
  }
}

function getLineIntersectionXZ(p1, p2, p3, p4) {
  let x1 = p1.x, z1 = p1.z;
  let x2 = p2.x, z2 = p2.z;
  let x3 = p3.x, z3 = p3.z;
  let x4 = p4.x, z4 = p4.z;

  let denom = (z4 - z3) * (x2 - x1) - (x4 - x3) * (z2 - z1);
  if (denom === 0) return null;

  let ua = ((x4 - x3) * (z1 - z3) - (z4 - z3) * (x1 - x3)) / denom;
  let ub = ((x2 - x1) * (z1 - z3) - (z2 - z1) * (x1 - x3)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return createVector(x1 + ua * (x2 - x1), p1.y, z1 + ua * (z2 - z1));
  }
  return null;
}

class Building extends Area3D {
  constructor(address, name, details) {
    super(address, name, details, colors.building[0], colors.building[1], colors.building[2]);
  }
}

class DetalisedBuilding extends DetalisedArea3D {
  constructor(address, name, details) {
    super(address, name, details);
  }
}

class Hospital extends Area3D {
  constructor(address, name, details) {
    super(address, name, details, colors.hospital[0], colors.hospital[1], colors.hospital[2]);
  }
}

class Government extends Area3D {
  constructor(address, name, details) {
    super(address, name, details, colors.government[0], colors.government[1], colors.government[2]);
  }
}

class GreenArea extends Area {
  constructor(name, points) {
    super(name, points, colors.greenArea[0], colors.greenArea[1], colors.greenArea[2]);
  }
}

class Field extends Area {
  constructor(address, name, points) {
    super(name, points, colors.field[0], colors.field[1], colors.field[2]);
  }
}

class Water extends Area {
  constructor(name, points) {
    super(name, points, colors.water[0], colors.water[1], colors.water[2]);
  }
}

class Parking extends Area {
  constructor(points) {
    super("", points, colors.parking[0], colors.parking[1], colors.parking[2]);
  }
}

class Underlay extends Area {
  constructor(points) {
    super("", points, colors.underlay[0], colors.underlay[1], colors.underlay[2]);
  }
}

class Alley extends Area {
  constructor(name, points) {
    super(name, points, colors.alley[0], colors.alley[1], colors.alley[2]);
  }
}

class Label {
  constructor(address, name, type, level, location) {
    this.address = address;
    this.name = name;
    this.type = type;
    this.level = level;
    if (this.type === "monument") this.level = 4;
    this.location = location;
    this.x = location.x;
    this.y = location.y;
    this.z = location.z;
    this.icon = loadImage("data/" + this.type + "_" + theme + ".png");
    this.clr = this.getColorByType();
  }

  getColorByType() {
    switch (this.type) {
      case "bar":
      case "fastfood":
      case "cafe":
      case "restaurant":
        return color(224, 129, 58);
      case "church":
      case "vladimir_cathedral":
      case "church_near_the_station":
      case "flag":
      case "police":
      case "school":
      case "central_vladimir_university":
      case "synagogue":
      case "post":
      case "factory":
      case "monument":
        return color(142, 145, 149);
      case "museum":
      case "landmark":
      case "column_with_cross":
      case "theater":
      case "national_opera_ballet_theater":
        return color(16, 127, 116);
      case "hospital":
        return color(233, 121, 107);
      case "spa":
        return color(225, 116, 155);
      case "pharmacy":
        return color(13, 160, 0);
      case "business":
      case "office":
      case "barbershop":
      case "sports":
      case "hotel":
      case "bank":
        return color(112, 123, 230);
      case "shop":
      case "supermarket":
      case "hypermarket":
      case "clothes":
      case "furniture":
      case "plants":
      case "zoo":
        return color(12, 127, 170);
      case "station":
        return color(43, 43, 43);
      case "park":
      case "stadium":
        return color(59, 156, 88);
      case "metro":
        return color(83, 178, 62);
      case "road":
        return color(224, 224, 226);
      default:
        return color(255, 255, 255);
    }
  }

  show() {
    if (this.type === "station") {
      this.clr = theme === "dark" ? color(255, 255, 255) : color(43, 43, 43);
    }
    if (this.type !== "road") {
      if (this.level <= zoom && isPointVisible(this.location)) {
        push();
        translate(this.x, this.y, this.z);
        rotateY(-angleY);
        rotateX(-angleX);
        scale(1 / zoom);
        textAlign(CENTER, TOP);
        let h = this.icon.height;
        let w = this.icon.width;
        let d = 0;
        if (["column_with_cross", "central_vladimir_university", "national_opera_ballet_theater", "vladimir_cathedral", "church_near_the_station"].includes(this.type)) {
          h = 70;
          w = 70;
          d = -8;
        }
        if (zoom >= 2) {
          if (theme === "dark") fill(40, 40, 40, 125); else fill(215, 215, 215, 125);
          for (let r = 0; r < TWO_PI; r += 3 / 2) {
            let dx = cos(r) * 2;
            let dy = sin(r) * 2;
            if (this.icon) text(this.name, dx, w / 1.5 + d + dy);
            else text(this.name, dx, dy);
          }
          fill(this.clr);
          textSize(17);
          if (this.icon) text(this.name, 0, w / 1.5 + d);
          else {
            textSize(20);
            text(this.name, 0, 0);
          }
        }
        if (this.icon) {
          imageMode(CENTER);
          if (!["metro", "monument"].includes(this.type)) {
            if (theme === "dark") fill(40, 40, 40, 50); else fill(215, 215, 215, 125);
            if (w !== 70) circle(0, 0, w - 12);
            else circle(0, 0, 52);
          }
          image(this.icon, 0, 0, w / 1.7, h / 1.7);
        }
        pop();
      }
    }
  }
}

function preload() {
  font = loadFont("YandexSansText-Medium.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  applyTheme();

  Promise.all([
    loadJSON("data/alleys.json"),
    loadJSON("data/buildings.json"),
    loadJSON("data/detalised_buildings.json"),
    loadJSON("data/fields.json"),
    loadJSON("data/governments.json"),
    loadJSON("data/green_areas.json"),
    loadJSON("data/hospitals.json"),
    loadJSON("data/labels.json"),
    loadJSON("data/parkings.json"),
    loadJSON("data/railways.json"),
    loadJSON("data/roads.json"),
    loadJSON("data/underlays.json"),
    loadJSON("data/water.json") // note: original has "water.json" for waters
  ]).then(([alleysData, buildingsData, detalisedBuildingsData, fieldsData, governmentsData, greenAreasData, hospitalsData, labelsData, parkingsData, railwaysData, roadsData, underlaysData, watersData]) => {
    readJsonAlleys(alleysData);
    readJsonBuildings(buildingsData);
    readJsonDetalisedBuildings(detalisedBuildingsData);
    readJsonFields(fieldsData);
    readJsonGovernments(governmentsData);
    readJsonGreenAreas(greenAreasData);
    readJsonHospitals(hospitalsData);
    readJsonLabels(labelsData);
    readJsonParkings(parkingsData);
    readJsonRailways(railwaysData);
    readJsonRoads(roadsData);
    readJsonUnderlays(underlaysData);
    readJsonWaters(watersData);
  });
}

function draw() {
  background(colors.underlay[0], colors.underlay[1], colors.underlay[2]);
  push();
  translate(0, 100, 0);
  scale(zoom);
  rotateX(angleX);
  rotateY(angleY);
  translate(offsetX, 0, offsetZ);
  updateHover();
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
  drawMetroLines();
  drawLabels();
  pop();
}

function drawPolygon(points) {
  beginShape();
  for (let p of points) {
    vertex(p.x, p.y, p.z);
  }
  endShape(CLOSE);
}

function isPointVisible(p) {
  let sx = screenX(p.x, p.y, p.z);
  let sy = screenY(p.x, p.y, p.z);
  let sz = screenZ(p.x, p.y, p.z);
  return (sx >= -width / 2 && sx <= width / 2 && sy >= -height / 2 && sy <= height / 2 && sz >= 0);
}

function drawAlleys() {
  for (let alley of alleys) alley.show();
}

function drawBuildings() {
  for (let building of buildings) {
    loop: for (let detail of building.details) {
      for (let point of detail.down_points) {
        if (isPointVisible(point)) {
          building.show();
          break loop;
        }
      }
      for (let point of detail.up_points) {
        if (isPointVisible(point)) {
          building.show();
          break loop;
        }
      }
    }
  }
}

function drawDetalisedBuildings() {
  for (let db of detalised_buildings) db.show();
}

function drawFields() {
  for (let field of fields) field.show();
}

function drawGovernments() {
  for (let gov of governments) {
    loop: for (let detail of gov.details) {
      for (let point of detail.down_points) {
        if (isPointVisible(point)) {
          gov.show();
          break loop;
        }
      }
      for (let point of detail.up_points) {
        if (isPointVisible(point)) {
          gov.show();
          break loop;
        }
      }
    }
  }
}

function drawGreenAreas() {
  for (let ga of green_areas) ga.show();
}

function drawHospitals() {
  for (let hosp of hospitals) {
    loop: for (let detail of hosp.details) {
      for (let point of detail.down_points) {
        if (isPointVisible(point)) {
          hosp.show();
          break loop;
        }
      }
      for (let point of detail.up_points) {
        if (isPointVisible(point)) {
          hosp.show();
          break loop;
        }
      }
    }
  }
}

function drawLabels() {
  for (let label of labels) label.show();
}

function drawParkings() {
  for (let parking of parkings) parking.show();
}

function drawRailways() {
  for (let railway of railways) railway.show();
}

function drawRoads() {
  for (let road of roads) road.show();
}

function drawUnderlays() {
  for (let underlay of underlays) underlay.show();
}

function drawWaters() {
  for (let water of waters) water.show();
}

function drawMetroLines() {
  if (zoom >= 0.25 && zoom <= 4) {
    strokeWeight(1 / zoom);
    noFill();
    stroke(157, 82, 26, 150);
    beginShape();
    curveVertex(-26, 8, -232);
    curveVertex(-26, 8, -232);
    curveVertex(-708, 8, -711);
    curveVertex(-1345, 8, -1309);
    curveVertex(-1345, 8, -1309);
    endShape();

    stroke(237, 1, 21, 150);
    beginShape();
    curveVertex(-33, 8, -496);
    curveVertex(-33, 8, -496);
    curveVertex(-638, 8, -244);
    curveVertex(-849, 8, 90);
    curveVertex(-849, 8, 90);
    endShape();
    noStroke();
  }
}

function pointInPolygon2D(poly, x, y) {
  let c = false;
  let n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    let pi = poly[i];
    let pj = poly[j];
    if (((pi.y > y) !== (pj.y > y)) &&
        (x < (pj.x - pi.x) * (y - pi.y) / (pj.y - pi.y) + pi.x)) {
      c = !c;
    }
  }
  return c;
}

function updateHover() {
  hoveredArea3D = null;
  let bestDist = Infinity;

  // Buildings
  for (let b of buildings) {
    for (let d of b.details) {
      let down = d.down_points;
      let up = d.up_points;
      let poly = down.map(p => createVector(screenX(p.x, p.y, p.z), screenY(p.x, p.y, p.z)));
      let inside = pointInPolygon2D(poly, mouseX, mouseY);
      if (!inside) {
        poly = up.map(p => createVector(screenX(p.x, p.y, p.z), screenY(p.x, p.y, p.z)));
        inside = pointInPolygon2D(poly, mouseX, mouseY);
      }
      if (!inside) {
        for (let k = 0; k < down.length && !inside; k++) {
          let p1 = down[k];
          let p2 = down[(k + 1) % down.length];
          let p3 = up[(k + 1) % up.length];
          let p4 = up[k];
          let wall = [
            createVector(screenX(p1.x, p1.y, p1.z), screenY(p1.x, p1.y, p1.z)),
            createVector(screenX(p2.x, p2.y, p2.z), screenY(p2.x, p2.y, p2.z)),
            createVector(screenX(p3.x, p3.y, p3.z), screenY(p3.x, p3.y, p3.z)),
            createVector(screenX(p4.x, p4.y, p4.z), screenY(p4.x, p4.y, p4.z))
          ];
          inside = pointInPolygon2D(wall, mouseX, mouseY);
          if (inside) break;
        }
      }
      if (inside) {
        let cx = poly.reduce((sum, p) => sum + p.x, 0) / poly.length;
        let cy = poly.reduce((sum, p) => sum + p.y, 0) / poly.length;
        let d2 = dist(cx, cy, mouseX, mouseY);
        if (d2 < bestDist) {
          bestDist = d2;
          hoveredArea3D = b;
        }
      }
    }
  }

  // Hospitals
  for (let h of hospitals) {
    // аналогичный код как для buildings
    for (let d of h.details) {
      let down = d.down_points;
      let up = d.up_points;
      let poly = down.map(p => createVector(screenX(p.x, p.y, p.z), screenY(p.x, p.y, p.z)));
      let inside = pointInPolygon2D(poly, mouseX, mouseY);
      if (!inside) {
        poly = up.map(p => createVector(screenX(p.x, p.y, p.z), screenY(p.x, p.y, p.z)));
        inside = pointInPolygon2D(poly, mouseX, mouseY);
      }
      if (!inside) {
        for (let k = 0; k < down.length && !inside; k++) {
          let p1 = down[k];
          let p2 = down[(k + 1) % down.length];
          let p3 = up[(k + 1) % up.length];
          let p4 = up[k];
          let wall = [
            createVector(screenX(p1.x, p1.y, p1.z), screenY(p1.x, p1.y, p1.z)),
            createVector(screenX(p2.x, p2.y, p2.z), screenY(p2.x, p2.y, p2.z)),
            createVector(screenX(p3.x, p3.y, p3.z), screenY(p3.x, p3.y, p3.z)),
            createVector(screenX(p4.x, p4.y, p4.z), screenY(p4.x, p4.y, p4.z))
          ];
          inside = pointInPolygon2D(wall, mouseX, mouseY);
          if (inside) break;
        }
      }
      if (inside) {
        let cx = poly.reduce((sum, p) => sum + p.x, 0) / poly.length;
        let cy = poly.reduce((sum, p) => sum + p.y, 0) / poly.length;
        let d2 = dist(cx, cy, mouseX, mouseY);
        if (d2 < bestDist) {
          bestDist = d2;
          hoveredArea3D = h;
        }
      }
    }
  }

  // Governments
  for (let g of governments) {
    // аналогично
    for (let d of g.details) {
      let down = d.down_points;
      let up = d.up_points;
      let poly = down.map(p => createVector(screenX(p.x, p.y, p.z), screenY(p.x, p.y, p.z)));
      let inside = pointInPolygon2D(poly, mouseX, mouseY);
      if (!inside) {
        poly = up.map(p => createVector(screenX(p.x, p.y, p.z), screenY(p.x, p.y, p.z)));
        inside = pointInPolygon2D(poly, mouseX, mouseY);
      }
      if (!inside) {
        for (let k = 0; k < down.length && !inside; k++) {
          let p1 = down[k];
          let p2 = down[(k + 1) % down.length];
          let p3 = up[(k + 1) % up.length];
          let p4 = up[k];
          let wall = [
            createVector(screenX(p1.x, p1.y, p1.z), screenY(p1.x, p1.y, p1.z)),
            createVector(screenX(p2.x, p2.y, p2.z), screenY(p2.x, p2.y, p2.z)),
            createVector(screenX(p3.x, p3.y, p3.z), screenY(p3.x, p3.y, p3.z)),
            createVector(screenX(p4.x, p4.y, p4.z), screenY(p4.x, p4.y, p4.z))
          ];
          inside = pointInPolygon2D(wall, mouseX, mouseY);
          if (inside) break;
        }
      }
      if (inside) {
        let cx = poly.reduce((sum, p) => sum + p.x, 0) / poly.length;
        let cy = poly.reduce((sum, p) => sum + p.y, 0) / poly.length;
        let d2 = dist(cx, cy, mouseX, mouseY);
        if (d2 < bestDist) {
          bestDist = d2;
          hoveredArea3D = g;
        }
      }
    }
  }
}

function mouseDragged() {
  let sensitivity = 1.0 / zoom;
  let deltaX = mouseX - pmouseX;
  let deltaY = mouseY - pmouseY;
  if (keyIsDown(CONTROL)) {
    angleY -= deltaX * 0.005;
    angleX -= deltaY * 0.005;
    angleX = constrain(angleX, PI / 2, PI / 1.25);
  } else {
    let cosY = cos(angleY);
    let sinY = sin(angleY);
    offsetX += (deltaY * sinY + deltaX * cosY) * sensitivity;
    offsetZ -= (deltaY * cosY - deltaX * sinY) * sensitivity;
  }
  return false;
}

function mouseWheel(event) {
  let e = event.delta;
  let zoomSpeed = 0.1;
  let oldZoom = zoom;
  zoom *= 1 - Math.sign(e) * zoomSpeed;
  zoom = constrain(zoom, 0.1, 15.0);
  let deltaZoom = zoom - oldZoom;
  let normX = (mouseX / width) - 0.5;
  let normZ = (mouseY / height) - 0.5;
  let smoothingFactor = 1.0 / Math.pow(zoom, 1.5);
  let deltaX = -normX * deltaZoom * width * smoothingFactor;
  let deltaZ = -normZ * deltaZoom * height * smoothingFactor;
  let cosY = cos(angleY);
  let sinY = sin(angleY);
  offsetX += (deltaZ * sinY + deltaX * cosY) / zoom;
  offsetZ -= (deltaZ * cosY - deltaX * sinY) / zoom;
  return false;
}

function keyPressed() {
  if (key === 'q') {
    theme = theme === "light" ? "dark" : "light";
    applyTheme();
    for (let l of labels) {
      l.icon = loadImage("data/" + l.type + "_" + theme + ".png");
    }
  }
}

function applyTheme() {
  if (theme === "dark") {
    colors.building = [55, 68, 91];
    colors.hospital = [66, 61, 76];
    colors.government = [54, 64, 101];
    colors.greenArea = [28, 68, 64];
    colors.field = [42, 85, 80];
    colors.water = [0, 21, 97];
    colors.road = [83, 102, 143];
    colors.parking = [38, 47, 66];
    colors.underlay = [40, 49, 68];
    colors.alley = [68, 85, 125];
  } else {
    colors.building = [227, 218, 214];
    colors.hospital = [239, 213, 221];
    colors.government = [221, 219, 229];
    colors.greenArea = [205, 236, 178];
    colors.field = [199, 219, 184];
    colors.water = [148, 212, 250];
    colors.road = [192, 199, 213];
    colors.parking = [192, 199, 213];
    colors.underlay = [249, 248, 247];
    colors.alley = [192, 199, 213];
  }

  for (let b of buildings) {
    b.r = colors.building[0]; b.g = colors.building[1]; b.b = colors.building[2];
  }
  for (let db of detalised_buildings) {
    // detalised have per detail colors, no need
  }
  for (let h of hospitals) {
    h.r = colors.hospital[0]; h.g = colors.hospital[1]; h.b = colors.hospital[2];
  }
  for (let g of governments) {
    g.r = colors.government[0]; g.g = colors.government[1]; g.b = colors.government[2];
  }
  for (let ga of green_areas) {
    ga.r = colors.greenArea[0]; ga.g = colors.greenArea[1]; ga.b = colors.greenArea[2];
  }
  for (let f of fields) {
    f.r = colors.field[0]; f.g = colors.field[1]; f.b = colors.field[2];
  }
  for (let w of waters) {
    w.r = colors.water[0]; w.g = colors.water[1]; w.b = colors.water[2];
  }
  for (let r of roads) {
    r.r = colors.road[0]; r.g = colors.road[1]; r.b = colors.road[2];
  }
  for (let p of parkings) {
    p.r = colors.parking[0]; p.g = colors.parking[1]; p.b = colors.parking[2];
  }
  for (let u of underlays) {
    u.r = colors.underlay[0]; u.g = colors.underlay[1]; u.b = colors.underlay[2];
  }
  for (let a of alleys) {
    a.r = colors.alley[0]; a.g = colors.alley[1]; a.b = colors.alley[2];
  }
}

function readJsonAlleys(data) {
  for (let alley of data.alleys) {
    let points = alley.points.map(p => createVector(p[0], p[1], p[2]));
    alleys.push(new Alley(alley.name, points));
  }
}

function readJsonBuildings(data) {
  for (let building of data.buildings) {
    let details = [];
    for (let detail of building.details) {
      let down_points = detail.down_points.map(p => createVector(p[0] + 0.01, p[1] + 0.01, p[2] + 0.01));
      let up_points = detail.up_points.map(p => createVector(p[0] + 0.01, p[1], p[2] + 0.01));
      details.push(new Detail(down_points, up_points));
    }
    buildings.push(new Building(building.address, building.name, details));
  }
}

function readJsonDetalisedBuildings(data) {
  for (let db of data.detalised_buildings) {
    let details = [];
    for (let detail of db.details) {
      let down_points = detail.down_points.map(p => createVector(p[0] + 0.01, p[1] + 0.01, p[2] + 0.01));
      let up_points = detail.up_points.map(p => createVector(p[0] + 0.01, p[1], p[2] + 0.01));
      let lclr = color(detail.light_color[0], detail.light_color[1], detail.light_color[2]);
      let dclr = color(detail.dark_color[0], detail.dark_color[1], detail.dark_color[2]);
      details.push(new ExtendedDetail(down_points, up_points, lclr, dclr));
    }
    detalised_buildings.push(new DetalisedBuilding(db.address, db.name, details));
  }
}

function readJsonFields(data) {
  for (let field of data.fields) {
    let points = field.points.map(p => createVector(p[0], p[1], p[2]));
    fields.push(new Field(field.address, field.name, points));
  }
}

function readJsonGovernments(data) {
  for (let gov of data.governments) {
    let details = [];
    for (let detail of gov.details) {
      let down_points = detail.down_points.map(p => createVector(p[0], p[1] + 0.01, p[2]));
      let up_points = detail.up_points.map(p => createVector(p[0], p[1], p[2]));
      details.push(new Detail(down_points, up_points));
    }
    governments.push(new Government(gov.address, gov.name, details));
  }
}

function readJsonGreenAreas(data) {
  for (let ga of data.green_areas) {
    let points = ga.points.map(p => createVector(p[0], p[1], p[2]));
    green_areas.push(new GreenArea(ga.name, points));
  }
}

function readJsonHospitals(data) {
  for (let hosp of data.hospitals) {
    let details = [];
    for (let detail of hosp.details) {
      let down_points = detail.down_points.map(p => createVector(p[0], p[1] + 0.01, p[2]));
      let up_points = detail.up_points.map(p => createVector(p[0], p[1], p[2]));
      details.push(new Detail(down_points, up_points));
    }
    hospitals.push(new Hospital(hosp.address, hosp.name, details));
  }
}

function readJsonLabels(data) {
  for (let label of data.labels) {
    let location = createVector(label.point[0], label.point[1], label.point[2]);
    labels.push(new Label(label.address, label.name, label.type, label.level, location));
  }
}

function readJsonParkings(data) {
  for (let parking of data.parkings) {
    let points = parking.points.map(p => createVector(p[0], p[1], p[2]));
    parkings.push(new Parking(points));
  }
}

function readJsonRailways(data) {
  for (let railway of data.railways) {
    let points = railway.points.map(p => createVector(p[0], p[1] - 0.006, p[2]));
    railways.push(new Railway(points));
  }
}

function readJsonRoads(data) {
  for (let road of data.roads) {
    let points = road.points.map(p => createVector(p[0], p[1] + 0.05, p[2]));
    roads.push(new Road(road.name, points));
  }
}

function readJsonUnderlays(data) {
  for (let underlay of data.underlays) {
    let points = underlay.points.map(p => createVector(p[0], p[1], p[2]));
    underlays.push(new Underlay(points));
  }
}

function readJsonWaters(data) {
  for (let water of data.water) {
    let points = water.points.map(p => createVector(p[0], p[1] - 0.1, p[2]));
    waters.push(new Water(water.name, points));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}// grdkmap.js — p5.js версия (2025)

let theme = "light";
let zoom = 1;
let offsetX = 0;
let offsetZ = 0;
let angleX = PI / 2;
let angleY = 0;

let font;

let colors = {};

let alleys = [], buildings = [], detalised_buildings = [], fields = [], governments = [];
let green_areas = [], hospitals = [], labels = [], parkings = [], railways = [], roads = [], underlays = [], waters = [];

let hoveredArea3D = null;
let selectedArea3D = null;

let currentFrameLabels = [];
let lastFrameChecked = -1;

class Detail {
  constructor(down_points, up_points) {
    this.down_points = down_points;
    this.up_points = up_points;
  }
}

class ExtendedDetail {
  constructor(down_points, up_points, lclr, dclr) {
    this.down_points = down_points;
    this.up_points = up_points;
    this.lclr = lclr;
    this.dclr = dclr;
  }
}

class Area {
  constructor(name, points, r, g, b) {
    this.name = name;
    this.points = points;
    this.r = r;
    this.g = g;
    this.b = b;
  }

  show() {
    fill(this.r, this.g, this.b);
    drawPolygon(this.points);
  }
}

class Area3D {
  constructor(address, name, details, r, g, b) {
    this.address = address;
    this.name = name;
    this.details = details;
    this.r = r;
    this.g = g;
    this.b = b;
  }

  show() {
    let isHovered = (this === hoveredArea3D);
    let isSelected = (this === selectedArea3D);
    if (isSelected) {
      fill(100, 150, 255, 220);
    } else if (isHovered) {
      fill((this.r + 75) / 2, (this.g + 100) / 2, (this.b + 169) / 2, 120);
    } else {
      fill(this.r, this.g, this.b, 175);
    }
    for (let j = 0; j < this.details.length; j++) {
      drawPolygon(this.details[j].down_points);
      drawPolygon(this.details[j].up_points);
      for (let i = 0; i < this.details[j].down_points.length; i++) {
        let p1 = this.details[j].down_points[i];
        let p2 = this.details[j].down_points[(i + 1) % this.details[j].down_points.length];
        let p3 = this.details[j].up_points[(i + 1) % this.details[j].up_points.length];
        let p4 = this.details[j].up_points[i];
        beginShape(QUADS);
        vertex(p1.x, p1.y + 0.01, p1.z);
        vertex(p2.x, p2.y + 0.01, p2.z);
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
      fill(theme === "dark" ? this.details[j].dclr : this.details[j].lclr);
      drawPolygon(this.details[j].down_points);
      drawPolygon(this.details[j].up_points);
      for (let i = 0; i < this.details[j].down_points.length; i++) {
        let p1 = this.details[j].down_points[i];
        let p2 = this.details[j].down_points[(i + 1) % this.details[j].down_points.length];
        let p3 = this.details[j].up_points[(i + 1) % this.details[j].up_points.length];
        let p4 = this.details[j].up_points[i];
        beginShape(QUADS);
        vertex(p1.x, p1.y + 0.01, p1.z);
        vertex(p2.x, p2.y + 0.01, p2.z);
        vertex(p3.x, p3.y, p3.z);
        vertex(p4.x, p4.y, p4.z);
        endShape();
      }
    }
  }
}

class Railway {
  constructor(points) {
    this.points = points;
    this.segmentLength = 15.0;
  }

  show() {
    let totalLength = this.calculateTotalLength();
    let distance = 0;
    while (distance < totalLength) {
      let start = this.getPointAtDistance(distance);
      let end = this.getPointAtDistance(distance + this.segmentLength);
      strokeWeight(sqrt(zoom) / zoom * 2);
      if ((distance / (2 * this.segmentLength)) % 1 < 0.5) {
        if (theme === "dark") stroke(97, 114, 154);
        else stroke(200, 210, 210);
      } else {
        if (theme === "dark") stroke(67, 80, 109);
        else stroke(152, 176, 176);
      }
      line(start.x, start.y - 1, start.z, end.x, end.y - 1, end.z);
      distance += this.segmentLength;
    }
    noStroke();
  }

  calculateTotalLength() {
    let length = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      length += p5.Vector.dist(this.points[i], this.points[i + 1]);
    }
    return length;
  }

  getPointAtDistance(distance) {
    let remaining = distance;
    for (let i = 0; i < this.points.length - 1; i++) {
      let p1 = this.points[i];
      let p2 = this.points[i + 1];
      let segmentDist = p5.Vector.dist(p1, p2);
      if (remaining <= segmentDist) {
        let t = remaining / segmentDist;
        return p5.Vector.lerp(p1, p2, t);
      }
      remaining -= segmentDist;
    }
    return this.points[this.points.length - 1];
  }
}

class Road extends Area {
  constructor(name, points) {
    super(name, points, colors.road[0], colors.road[1], colors.road[2]);
  }

  show() {
    super.show();
    if (zoom >= 1.5 && this.name && this.name.length > 0) {
      this.drawRoadLabel();
    }
  }

  drawRoadLabel() {
    if (frameCount !== lastFrameChecked) {
      currentFrameLabels = [];
      lastFrameChecked = frameCount;
    }

    let bestP1 = null;
    let bestP2 = null;
    let maxScreenDist = 0;

    let n = this.points.length;
    for (let i = 0; i < n; i++) {
      let p1 = this.points[i];
      let p2 = this.points[(i + 1) % n];

      let mid = p5.Vector.add(p1, p2).mult(0.5);
      if (!isPointVisible(mid)) continue;

      let sx1 = screenX(p1.x, p1.y, p1.z);
      let sy1 = screenY(p1.x, p1.y, p1.z);
      let sx2 = screenX(p2.x, p2.y, p2.z);
      let sy2 = screenY(p2.x, p2.y, p2.z);

      if ((sx1 < 0 && sx2 < 0) || (sx1 > width && sx2 > width)) continue;
      if ((sy1 < 0 && sy2 < 0) || (sy1 > height && sy2 > height)) continue;

      let distScreen = dist(sx1, sy1, sx2, sy2);
      if (distScreen > maxScreenDist) {
        maxScreenDist = distScreen;
        bestP1 = p1;
        bestP2 = p2;
      }
    }

    if (bestP1 === null || maxScreenDist < 60) return;

    let pA = bestP1;
    let pB = bestP2;

    let sxA = screenX(pA.x, pA.y, pA.z);
    let sxB = screenX(pB.x, pB.y, pB.z);

    if (sxA > sxB) {
      [pA, pB] = [pB, pA];
    }

    let segmentDir = p5.Vector.sub(pB, pA);
    let angle = -atan2(segmentDir.z, segmentDir.x);

    let segmentEdgeMid = p5.Vector.add(pA, pB).mult(0.5);
    let normal = createVector(-segmentDir.z, 0, segmentDir.x).normalize();

    let testPoint = p5.Vector.add(segmentEdgeMid, normal.mult(0.1));
    if (!this.isPointInsidePolygonXZ(testPoint)) {
      normal.mult(-1);
    }

    let oppositePoint = this.findRayIntersection(segmentEdgeMid, normal);

    let textPos;
    if (oppositePoint !== null) {
      textPos = p5.Vector.add(segmentEdgeMid, oppositePoint).mult(0.5);
    } else {
      textPos = p5.Vector.add(segmentEdgeMid, normal.mult(4.0));
    }
    textPos.y += 0.5;

    let screenXPos = screenX(textPos.x, textPos.y, textPos.z);
    let screenYPos = screenY(textPos.y, textPos.y, textPos.z);

    textFont(font);
    textSize(17);
    let txtW = textWidth(this.name);
    let txtH = 20;

    for (let l of labels) {
      if (!isPointVisible(l.location) || l.level > zoom) continue;
      let lx = screenX(l.location.x, l.location.y, l.location.z);
      let ly = screenY(l.location.x, l.location.y, l.location.z);
      if (abs(screenXPos - lx) < (txtW / 2 + 25) && abs(screenYPos - ly) < (txtH / 2 + 25)) return;
    }

    for (let rect of currentFrameLabels) {
      if (abs(screenXPos - rect[0]) < (txtW / 2 + rect[2] / 2) && abs(screenYPos - rect[1]) < (txtH / 2 + rect[3] / 2)) return;
    }

    push();
    translate(textPos.x, textPos.y, textPos.z);
    scale(1 / zoom);
    rotateY(angle);
    rotateX(PI / 2);
    scale(1, -1, 1);
    textAlign(CENTER, CENTER);
    if (theme === "dark") fill(40, 40, 40, 125); else fill(215, 215, 215, 125);
    for (let r = 0; r < TWO_PI; r += 3 / 2) {
      let dx = cos(r) * 2;
      let dy = sin(r) * 2;
      text(this.name, dx, dy);
    }
    if (theme === "dark") fill(220, 220, 220, 230);
    else fill(50, 50, 50, 230);
    text(this.name, 0, 0);
    pop();

    currentFrameLabels.push([screenXPos, screenYPos, txtW, txtH]);
  }

  isPointInsidePolygonXZ(p) {
    let inside = false;
    let n = this.points.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      let pi = this.points[i];
      let pj = this.points[j];
      if (((pi.z > p.z) !== (pj.z > p.z)) &&
          (p.x < (pj.x - pi.x) * (p.z - pi.z) / (pj.z - pi.z) + pi.x)) {
        inside = !inside;
      }
    }
    return inside;
  }

  findRayIntersection(origin, dir) {
    let closestIntersection = null;
    let minDistSq = Infinity;
    let n = this.points.length;
    for (let i = 0; i < n; i++) {
      let p1 = this.points[i];
      let p2 = this.points[(i + 1) % n];

      if (p5.Vector.dist(origin, p1) < 0.1 || p5.Vector.dist(origin, p2) < 0.1) continue;

      let intersection = getLineIntersectionXZ(origin, p5.Vector.add(origin, dir.mult(1000)), p1, p2);

      if (intersection !== null) {
        let dSq = p5.Vector.distSquared(origin, intersection);
        if (dSq > 0.1 && dSq < minDistSq) {
          minDistSq = dSq;
          closestIntersection = intersection;
        }
      }
    }
    return closestIntersection;
  }
}

function getLineIntersectionXZ(p1, p2, p3, p4) {
  let x1 = p1.x, z1 = p1.z;
  let x2 = p2.x, z2 = p2.z;
  let x3 = p3.x, z3 = p3.z;
  let x4 = p4.x, z4 = p4.z;

  let denom = (z4 - z3) * (x2 - x1) - (x4 - x3) * (z2 - z1);
  if (denom === 0) return null;

  let ua = ((x4 - x3) * (z1 - z3) - (z4 - z3) * (x1 - x3)) / denom;
  let ub = ((x2 - x1) * (z1 - z3) - (z2 - z1) * (x1 - x3)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return createVector(x1 + ua * (x2 - x1), p1.y, z1 + ua * (z2 - z1));
  }
  return null;
}

class Building extends Area3D {
  constructor(address, name, details) {
    super(address, name, details, colors.building[0], colors.building[1], colors.building[2]);
  }
}

class DetalisedBuilding extends DetalisedArea3D {
  constructor(address, name, details) {
    super(address, name, details);
  }
}

class Hospital extends Area3D {
  constructor(address, name, details) {
    super(address, name, details, colors.hospital[0], colors.hospital[1], colors.hospital[2]);
  }
}

class Government extends Area3D {
  constructor(address, name, details) {
    super(address, name, details, colors.government[0], colors.government[1], colors.government[2]);
  }
}

class GreenArea extends Area {
  constructor(name, points) {
    super(name, points, colors.greenArea[0], colors.greenArea[1], colors.greenArea[2]);
  }
}

class Field extends Area {
  constructor(address, name, points) {
    super(name, points, colors.field[0], colors.field[1], colors.field[2]);
  }
}

class Water extends Area {
  constructor(name, points) {
    super(name, points, colors.water[0], colors.water[1], colors.water[2]);
  }
}

class Parking extends Area {
  constructor(points) {
    super("", points, colors.parking[0], colors.parking[1], colors.parking[2]);
  }
}

class Underlay extends Area {
  constructor(points) {
    super("", points, colors.underlay[0], colors.underlay[1], colors.underlay[2]);
  }
}

class Alley extends Area {
  constructor(name, points) {
    super(name, points, colors.alley[0], colors.alley[1], colors.alley[2]);
  }
}

class Label {
  constructor(address, name, type, level, location) {
    this.address = address;
    this.name = name;
    this.type = type;
    this.level = level;
    if (this.type === "monument") this.level = 4;
    this.location = location;
    this.x = location.x;
    this.y = location.y;
    this.z = location.z;
    this.icon = loadImage("data/" + this.type + "_" + theme + ".png");
    this.clr = this.getColorByType();
  }

  getColorByType() {
    switch (this.type) {
      case "bar":
      case "fastfood":
      case "cafe":
      case "restaurant":
        return color(224, 129, 58);
      case "church":
      case "vladimir_cathedral":
      case "church_near_the_station":
      case "flag":
      case "police":
      case "school":
      case "central_vladimir_university":
      case "synagogue":
      case "post":
      case "factory":
      case "monument":
        return color(142, 145, 149);
      case "museum":
      case "landmark":
      case "column_with_cross":
      case "theater":
      case "national_opera_ballet_theater":
        return color(16, 127, 116);
      case "hospital":
        return color(233, 121, 107);
      case "spa":
        return color(225, 116, 155);
      case "pharmacy":
        return color(13, 160, 0);
      case "business":
      case "office":
      case "barbershop":
      case "sports":
      case "hotel":
      case "bank":
        return color(112, 123, 230);
      case "shop":
      case "supermarket":
      case "hypermarket":
      case "clothes":
      case "furniture":
      case "plants":
      case "zoo":
        return color(12, 127, 170);
      case "station":
        return color(43, 43, 43);
      case "park":
      case "stadium":
        return color(59, 156, 88);
      case "metro":
        return color(83, 178, 62);
      case "road":
        return color(224, 224, 226);
      default:
        return color(255, 255, 255);
    }
  }

  show() {
    if (this.type === "station") {
      this.clr = theme === "dark" ? color(255, 255, 255) : color(43, 43, 43);
    }
    if (this.type !== "road") {
      if (this.level <= zoom && isPointVisible(this.location)) {
        push();
        translate(this.x, this.y, this.z);
        rotateY(-angleY);
        rotateX(-angleX);
        scale(1 / zoom);
        textAlign(CENTER, TOP);
        let h = this.icon.height;
        let w = this.icon.width;
        let d = 0;
        if (["column_with_cross", "central_vladimir_university", "national_opera_ballet_theater", "vladimir_cathedral", "church_near_the_station"].includes(this.type)) {
          h = 70;
          w = 70;
          d = -8;
        }
        if (zoom >= 2) {
          if (theme === "dark") fill(40, 40, 40, 125); else fill(215, 215, 215, 125);
          for (let r = 0; r < TWO_PI; r += 3 / 2) {
            let dx = cos(r) * 2;
            let dy = sin(r) * 2;
            if (this.icon) text(this.name, dx, w / 1.5 + d + dy);
            else text(this.name, dx, dy);
          }
          fill(this.clr);
          textSize(17);
          if (this.icon) text(this.name, 0, w / 1.5 + d);
          else {
            textSize(20);
            text(this.name, 0, 0);
          }
        }
        if (this.icon) {
          imageMode(CENTER);
          if (!["metro", "monument"].includes(this.type)) {
            if (theme === "dark") fill(40, 40, 40, 50); else fill(215, 215, 215, 125);
            if (w !== 70) circle(0, 0, w - 12);
            else circle(0, 0, 52);
          }
          image(this.icon, 0, 0, w / 1.7, h / 1.7);
        }
        pop();
      }
    }
  }
}

function preload() {
  font = loadFont("YandexSansText-Medium.ttf");
}

function setup() {
let zoom = 1;
let offsetX = 0;
let offsetZ = 0;
let angleX = PI / 2;
let angleY = 0;

let font;

let colors = {};

let alleys = [], buildings = [], detalised_buildings = [], fields = [], governments = [];
let green_areas = [], hospitals = [], labels = [], parkings = [], railways = [], roads = [], underlays = [], waters = [];

let hoveredArea3D = null;
let selectedArea3D = null;

let currentFrameLabels = [];
let lastFrameChecked = -1;
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  applyTheme();
  let theme = "light";

  Promise.all([
    loadJSON("data/alleys.json"),
    loadJSON("data/buildings.json"),
    loadJSON("data/detalised_buildings.json"),
    loadJSON("data/fields.json"),
    loadJSON("data/governments.json"),
    loadJSON("data/green_areas.json"),
    loadJSON("data/hospitals.json"),
    loadJSON("data/labels.json"),
    loadJSON("data/parkings.json"),
    loadJSON("data/railways.json"),
    loadJSON("data/roads.json"),
    loadJSON("data/underlays.json"),
    loadJSON("data/water.json") // note: original has "water.json" for waters
  ]).then(([alleysData, buildingsData, detalisedBuildingsData, fieldsData, governmentsData, greenAreasData, hospitalsData, labelsData, parkingsData, railwaysData, roadsData, underlaysData, watersData]) => {
    readJsonAlleys(alleysData);
    readJsonBuildings(buildingsData);
    readJsonDetalisedBuildings(detalisedBuildingsData);
    readJsonFields(fieldsData);
    readJsonGovernments(governmentsData);
    readJsonGreenAreas(greenAreasData);
    readJsonHospitals(hospitalsData);
    readJsonLabels(labelsData);
    readJsonParkings(parkingsData);
    readJsonRailways(railwaysData);
    readJsonRoads(roadsData);
    readJsonUnderlays(underlaysData);
    readJsonWaters(watersData);
  });
}

function draw() {
  background(colors.underlay[0], colors.underlay[1], colors.underlay[2]);
  push();
  translate(0, 100, 0);
  scale(zoom);
  rotateX(angleX);
  rotateY(angleY);
  translate(offsetX, 0, offsetZ);
  updateHover();
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
  drawMetroLines();
  drawLabels();
  pop();
}

function drawPolygon(points) {
  beginShape();
  for (let p of points) {
    vertex(p.x, p.y, p.z);
  }
  endShape(CLOSE);
}

function isPointVisible(p) {
  let sx = screenX(p.x, p.y, p.z);
  let sy = screenY(p.x, p.y, p.z);
  let sz = screenZ(p.x, p.y, p.z);
  return (sx >= -width / 2 && sx <= width / 2 && sy >= -height / 2 && sy <= height / 2 && sz >= 0);
}

function drawAlleys() {
  for (let alley of alleys) alley.show();
}

function drawBuildings() {
  for (let building of buildings) {
    loop: for (let detail of building.details) {
      for (let point of detail.down_points) {
        if (isPointVisible(point)) {
          building.show();
          break loop;
        }
      }
      for (let point of detail.up_points) {
        if (isPointVisible(point)) {
          building.show();
          break loop;
        }
      }
    }
  }
}

function drawDetalisedBuildings() {
  for (let db of detalised_buildings) db.show();
}

function drawFields() {
  for (let field of fields) field.show();
}

function drawGovernments() {
  for (let gov of governments) {
    loop: for (let detail of gov.details) {
      for (let point of detail.down_points) {
        if (isPointVisible(point)) {
          gov.show();
          break loop;
        }
      }
      for (let point of detail.up_points) {
        if (isPointVisible(point)) {
          gov.show();
          break loop;
        }
      }
    }
  }
}

function drawGreenAreas() {
  for (let ga of green_areas) ga.show();
}

function drawHospitals() {
  for (let hosp of hospitals) {
    loop: for (let detail of hosp.details) {
      for (let point of detail.down_points) {
        if (isPointVisible(point)) {
          hosp.show();
          break loop;
        }
      }
      for (let point of detail.up_points) {
        if (isPointVisible(point)) {
          hosp.show();
          break loop;
        }
      }
    }
  }
}

function drawLabels() {
  for (let label of labels) label.show();
}

function drawParkings() {
  for (let parking of parkings) parking.show();
}

function drawRailways() {
  for (let railway of railways) railway.show();
}

function drawRoads() {
  for (let road of roads) road.show();
}

function drawUnderlays() {
  for (let underlay of underlays) underlay.show();
}

function drawWaters() {
  for (let water of waters) water.show();
}

function drawMetroLines() {
  if (zoom >= 0.25 && zoom <= 4) {
    strokeWeight(1 / zoom);
    noFill();
    stroke(157, 82, 26, 150);
    beginShape();
    curveVertex(-26, 8, -232);
    curveVertex(-26, 8, -232);
    curveVertex(-708, 8, -711);
    curveVertex(-1345, 8, -1309);
    curveVertex(-1345, 8, -1309);
    endShape();

    stroke(237, 1, 21, 150);
    beginShape();
    curveVertex(-33, 8, -496);
    curveVertex(-33, 8, -496);
    curveVertex(-638, 8, -244);
    curveVertex(-849, 8, 90);
    curveVertex(-849, 8, 90);
    endShape();
    noStroke();
  }
}

function pointInPolygon2D(poly, x, y) {
  let c = false;
  let n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    let pi = poly[i];
    let pj = poly[j];
    if (((pi.y > y) !== (pj.y > y)) &&
        (x < (pj.x - pi.x) * (y - pi.y) / (pj.y - pi.y) + pi.x)) {
      c = !c;
    }
  }
  return c;
}

function updateHover() {
  hoveredArea3D = null;
  let bestDist = Infinity;

  // Buildings
  for (let b of buildings) {
    for (let d of b.details) {
      let down = d.down_points;
      let up = d.up_points;
      let poly = down.map(p => createVector(screenX(p.x, p.y, p.z), screenY(p.x, p.y, p.z)));
      let inside = pointInPolygon2D(poly, mouseX, mouseY);
      if (!inside) {
        poly = up.map(p => createVector(screenX(p.x, p.y, p.z), screenY(p.x, p.y, p.z)));
        inside = pointInPolygon2D(poly, mouseX, mouseY);
      }
      if (!inside) {
        for (let k = 0; k < down.length && !inside; k++) {
          let p1 = down[k];
          let p2 = down[(k + 1) % down.length];
          let p3 = up[(k + 1) % up.length];
          let p4 = up[k];
          let wall = [
            createVector(screenX(p1.x, p1.y, p1.z), screenY(p1.x, p1.y, p1.z)),
            createVector(screenX(p2.x, p2.y, p2.z), screenY(p2.x, p2.y, p2.z)),
            createVector(screenX(p3.x, p3.y, p3.z), screenY(p3.x, p3.y, p3.z)),
            createVector(screenX(p4.x, p4.y, p4.z), screenY(p4.x, p4.y, p4.z))
          ];
          inside = pointInPolygon2D(wall, mouseX, mouseY);
          if (inside) break;
        }
      }
      if (inside) {
        let cx = poly.reduce((sum, p) => sum + p.x, 0) / poly.length;
        let cy = poly.reduce((sum, p) => sum + p.y, 0) / poly.length;
        let d2 = dist(cx, cy, mouseX, mouseY);
        if (d2 < bestDist) {
          bestDist = d2;
          hoveredArea3D = b;
        }
      }
    }
  }

  // Hospitals
  for (let h of hospitals) {
    // аналогичный код как для buildings
    for (let d of h.details) {
      let down = d.down_points;
      let up = d.up_points;
      let poly = down.map(p => createVector(screenX(p.x, p.y, p.z), screenY(p.x, p.y, p.z)));
      let inside = pointInPolygon2D(poly, mouseX, mouseY);
      if (!inside) {
        poly = up.map(p => createVector(screenX(p.x, p.y, p.z), screenY(p.x, p.y, p.z)));
        inside = pointInPolygon2D(poly, mouseX, mouseY);
      }
      if (!inside) {
        for (let k = 0; k < down.length && !inside; k++) {
          let p1 = down[k];
          let p2 = down[(k + 1) % down.length];
          let p3 = up[(k + 1) % up.length];
          let p4 = up[k];
          let wall = [
            createVector(screenX(p1.x, p1.y, p1.z), screenY(p1.x, p1.y, p1.z)),
            createVector(screenX(p2.x, p2.y, p2.z), screenY(p2.x, p2.y, p2.z)),
            createVector(screenX(p3.x, p3.y, p3.z), screenY(p3.x, p3.y, p3.z)),
            createVector(screenX(p4.x, p4.y, p4.z), screenY(p4.x, p4.y, p4.z))
          ];
          inside = pointInPolygon2D(wall, mouseX, mouseY);
          if (inside) break;
        }
      }
      if (inside) {
        let cx = poly.reduce((sum, p) => sum + p.x, 0) / poly.length;
        let cy = poly.reduce((sum, p) => sum + p.y, 0) / poly.length;
        let d2 = dist(cx, cy, mouseX, mouseY);
        if (d2 < bestDist) {
          bestDist = d2;
          hoveredArea3D = h;
        }
      }
    }
  }

  // Governments
  for (let g of governments) {
    // аналогично
    for (let d of g.details) {
      let down = d.down_points;
      let up = d.up_points;
      let poly = down.map(p => createVector(screenX(p.x, p.y, p.z), screenY(p.x, p.y, p.z)));
      let inside = pointInPolygon2D(poly, mouseX, mouseY);
      if (!inside) {
        poly = up.map(p => createVector(screenX(p.x, p.y, p.z), screenY(p.x, p.y, p.z)));
        inside = pointInPolygon2D(poly, mouseX, mouseY);
      }
      if (!inside) {
        for (let k = 0; k < down.length && !inside; k++) {
          let p1 = down[k];
          let p2 = down[(k + 1) % down.length];
          let p3 = up[(k + 1) % up.length];
          let p4 = up[k];
          let wall = [
            createVector(screenX(p1.x, p1.y, p1.z), screenY(p1.x, p1.y, p1.z)),
            createVector(screenX(p2.x, p2.y, p2.z), screenY(p2.x, p2.y, p2.z)),
            createVector(screenX(p3.x, p3.y, p3.z), screenY(p3.x, p3.y, p3.z)),
            createVector(screenX(p4.x, p4.y, p4.z), screenY(p4.x, p4.y, p4.z))
          ];
          inside = pointInPolygon2D(wall, mouseX, mouseY);
          if (inside) break;
        }
      }
      if (inside) {
        let cx = poly.reduce((sum, p) => sum + p.x, 0) / poly.length;
        let cy = poly.reduce((sum, p) => sum + p.y, 0) / poly.length;
        let d2 = dist(cx, cy, mouseX, mouseY);
        if (d2 < bestDist) {
          bestDist = d2;
          hoveredArea3D = g;
        }
      }
    }
  }
}

function mouseDragged() {
  let sensitivity = 1.0 / zoom;
  let deltaX = mouseX - pmouseX;
  let deltaY = mouseY - pmouseY;
  if (keyIsDown(CONTROL)) {
    angleY -= deltaX * 0.005;
    angleX -= deltaY * 0.005;
    angleX = constrain(angleX, PI / 2, PI / 1.25);
  } else {
    let cosY = cos(angleY);
    let sinY = sin(angleY);
    offsetX += (deltaY * sinY + deltaX * cosY) * sensitivity;
    offsetZ -= (deltaY * cosY - deltaX * sinY) * sensitivity;
  }
  return false;
}

function mouseWheel(event) {
  let e = event.delta;
  let zoomSpeed = 0.1;
  let oldZoom = zoom;
  zoom *= 1 - Math.sign(e) * zoomSpeed;
  zoom = constrain(zoom, 0.1, 15.0);
  let deltaZoom = zoom - oldZoom;
  let normX = (mouseX / width) - 0.5;
  let normZ = (mouseY / height) - 0.5;
  let smoothingFactor = 1.0 / Math.pow(zoom, 1.5);
  let deltaX = -normX * deltaZoom * width * smoothingFactor;
  let deltaZ = -normZ * deltaZoom * height * smoothingFactor;
  let cosY = cos(angleY);
  let sinY = sin(angleY);
  offsetX += (deltaZ * sinY + deltaX * cosY) / zoom;
  offsetZ -= (deltaZ * cosY - deltaX * sinY) / zoom;
  return false;
}

function keyPressed() {
  if (key === 'q') {
    theme = theme === "light" ? "dark" : "light";
    applyTheme();
    for (let l of labels) {
      l.icon = loadImage("data/" + l.type + "_" + theme + ".png");
    }
  }
}

function applyTheme() {
  if (theme === "dark") {
    colors.building = [55, 68, 91];
    colors.hospital = [66, 61, 76];
    colors.government = [54, 64, 101];
    colors.greenArea = [28, 68, 64];
    colors.field = [42, 85, 80];
    colors.water = [0, 21, 97];
    colors.road = [83, 102, 143];
    colors.parking = [38, 47, 66];
    colors.underlay = [40, 49, 68];
    colors.alley = [68, 85, 125];
  } else {
    colors.building = [227, 218, 214];
    colors.hospital = [239, 213, 221];
    colors.government = [221, 219, 229];
    colors.greenArea = [205, 236, 178];
    colors.field = [199, 219, 184];
    colors.water = [148, 212, 250];
    colors.road = [192, 199, 213];
    colors.parking = [192, 199, 213];
    colors.underlay = [249, 248, 247];
    colors.alley = [192, 199, 213];
  }

  for (let b of buildings) {
    b.r = colors.building[0]; b.g = colors.building[1]; b.b = colors.building[2];
  }
  for (let db of detalised_buildings) {
    // detalised have per detail colors, no need
  }
  for (let h of hospitals) {
    h.r = colors.hospital[0]; h.g = colors.hospital[1]; h.b = colors.hospital[2];
  }
  for (let g of governments) {
    g.r = colors.government[0]; g.g = colors.government[1]; g.b = colors.government[2];
  }
  for (let ga of green_areas) {
    ga.r = colors.greenArea[0]; ga.g = colors.greenArea[1]; ga.b = colors.greenArea[2];
  }
  for (let f of fields) {
    f.r = colors.field[0]; f.g = colors.field[1]; f.b = colors.field[2];
  }
  for (let w of waters) {
    w.r = colors.water[0]; w.g = colors.water[1]; w.b = colors.water[2];
  }
  for (let r of roads) {
    r.r = colors.road[0]; r.g = colors.road[1]; r.b = colors.road[2];
  }
  for (let p of parkings) {
    p.r = colors.parking[0]; p.g = colors.parking[1]; p.b = colors.parking[2];
  }
  for (let u of underlays) {
    u.r = colors.underlay[0]; u.g = colors.underlay[1]; u.b = colors.underlay[2];
  }
  for (let a of alleys) {
    a.r = colors.alley[0]; a.g = colors.alley[1]; a.b = colors.alley[2];
  }
}

function readJsonAlleys(data) {
  for (let alley of data.alleys) {
    let points = alley.points.map(p => createVector(p[0], p[1], p[2]));
    alleys.push(new Alley(alley.name, points));
  }
}

function readJsonBuildings(data) {
  for (let building of data.buildings) {
    let details = [];
    for (let detail of building.details) {
      let down_points = detail.down_points.map(p => createVector(p[0] + 0.01, p[1] + 0.01, p[2] + 0.01));
      let up_points = detail.up_points.map(p => createVector(p[0] + 0.01, p[1], p[2] + 0.01));
      details.push(new Detail(down_points, up_points));
    }
    buildings.push(new Building(building.address, building.name, details));
  }
}

function readJsonDetalisedBuildings(data) {
  for (let db of data.detalised_buildings) {
    let details = [];
    for (let detail of db.details) {
      let down_points = detail.down_points.map(p => createVector(p[0] + 0.01, p[1] + 0.01, p[2] + 0.01));
      let up_points = detail.up_points.map(p => createVector(p[0] + 0.01, p[1], p[2] + 0.01));
      let lclr = color(detail.light_color[0], detail.light_color[1], detail.light_color[2]);
      let dclr = color(detail.dark_color[0], detail.dark_color[1], detail.dark_color[2]);
      details.push(new ExtendedDetail(down_points, up_points, lclr, dclr));
    }
    detalised_buildings.push(new DetalisedBuilding(db.address, db.name, details));
  }
}

function readJsonFields(data) {
  for (let field of data.fields) {
    let points = field.points.map(p => createVector(p[0], p[1], p[2]));
    fields.push(new Field(field.address, field.name, points));
  }
}

function readJsonGovernments(data) {
  for (let gov of data.governments) {
    let details = [];
    for (let detail of gov.details) {
      let down_points = detail.down_points.map(p => createVector(p[0], p[1] + 0.01, p[2]));
      let up_points = detail.up_points.map(p => createVector(p[0], p[1], p[2]));
      details.push(new Detail(down_points, up_points));
    }
    governments.push(new Government(gov.address, gov.name, details));
  }
}

function readJsonGreenAreas(data) {
  for (let ga of data.green_areas) {
    let points = ga.points.map(p => createVector(p[0], p[1], p[2]));
    green_areas.push(new GreenArea(ga.name, points));
  }
}

function readJsonHospitals(data) {
  for (let hosp of data.hospitals) {
    let details = [];
    for (let detail of hosp.details) {
      let down_points = detail.down_points.map(p => createVector(p[0], p[1] + 0.01, p[2]));
      let up_points = detail.up_points.map(p => createVector(p[0], p[1], p[2]));
      details.push(new Detail(down_points, up_points));
    }
    hospitals.push(new Hospital(hosp.address, hosp.name, details));
  }
}

function readJsonLabels(data) {
  for (let label of data.labels) {
    let location = createVector(label.point[0], label.point[1], label.point[2]);
    labels.push(new Label(label.address, label.name, label.type, label.level, location));
  }
}

function readJsonParkings(data) {
  for (let parking of data.parkings) {
    let points = parking.points.map(p => createVector(p[0], p[1], p[2]));
    parkings.push(new Parking(points));
  }
}

function readJsonRailways(data) {
  for (let railway of data.railways) {
    let points = railway.points.map(p => createVector(p[0], p[1] - 0.006, p[2]));
    railways.push(new Railway(points));
  }
}

function readJsonRoads(data) {
  for (let road of data.roads) {
    let points = road.points.map(p => createVector(p[0], p[1] + 0.05, p[2]));
    roads.push(new Road(road.name, points));
  }
}

function readJsonUnderlays(data) {
  for (let underlay of data.underlays) {
    let points = underlay.points.map(p => createVector(p[0], p[1], p[2]));
    underlays.push(new Underlay(points));
  }
}

function readJsonWaters(data) {
  for (let water of data.water) {
    let points = water.points.map(p => createVector(p[0], p[1] - 0.1, p[2]));
    waters.push(new Water(water.name, points));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
