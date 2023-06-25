// prism.js

let sketchPrism = function (p5_) {
  // This setup function runs once at the start of the sketch.
  let canvas;
  p5_.setup = function () {
    canvas = p5_.createCanvas(p5_.windowWidth, p5_.windowHeight);
    canvas.position(0, 0);
    p5_.colorMode(p5_.RGB, 255, 255, 255, 100);
    p5_.strokeCap(p5_.SQUARE);

    window.addEventListener(
      "popstate",
      function () {
        prisms = [];
        canvas.clear();
        p5_.loadPrismsFromUrl();
      },
      false
    );

    p5_.loadPrismsFromUrl();
  };

  // This draw function runs continuously after setup.
  p5_.draw = function () {
    // Draws the Prism objects on the canvas each frame.
    // prisms must be instantiated globally for this to work.
    prisms.forEach((prism) => {
      prism.draw();
      // prism.drawNormals();
    });
  };

  // Make sure canvas is always the same was as viewport
  p5_.windowResized = function () {
    p5_.resizeCanvas(p5_.windowWidth, p5_.windowHeight);
  };

  // This function gets called every time a key is pressed
  p5_.keyPressed = function (e) {
    // Clear the prisms
    if (p5_.key === "c" || p5_.key === "C") {
      isPaused = true;
      prisms = [];
      window.history.pushState({}, document.title, "/");
      p5_.clear(); // Clear the pixels in the  canvas
    }
    // hide the prisms and just display the photons
    if (p5_.key === "h" || p5_.key === "H") {
      if (canvas.style("display") === "none") {
        canvas.show();
      } else {
        canvas.hide();
      }
    }
  };

  p5_.clearPrisms = function () {
    isPaused = true;
    prisms = [];
    p5_.clear(); // Clear the pixels in the  canvas
    storePrismsInUrl();
  };

  p5_.stringToPrisms = function (s) {
    let prismStrings = s.split("~");
    prismStrings.forEach((prismString) => {
      let pointStrings = prismString.split("-");
      let points = pointStrings.map((pointString) => {
        let coords = pointString.split("_");
        return p5_.createVector(parseInt(coords[0]), parseInt(coords[1]));
      });
      Prism.addPrism(new Prism(points)); // Assuming your Prism constructor takes an array of points
    });
    return;
  };

  p5_.loadPrismsFromUrl = function () {
    let params = new URLSearchParams(window.location.search);
    let prismString = params.get("prisms");
    if (prismString !== null) {
      try {
        p5_.stringToPrisms(prismString);
      } catch (e) {
        console.log(e);
        // Show a confirm dialog to the user
        let confirmed = confirm(
          "An error occurred while loading prisms from the URL. Would you like to reload the page?"
        );
        if (confirmed) {
          // If the user clicks "OK", reload the page without any URL parameters
          window.location = window.location.pathname;
        }
        return;
      }
    }
  };
};

class Prism {
  constructor(vertices, p5_) {
    this.p5_ = p5_ || p5Prisms;
    this.vertices = vertices; // vertices of the prism
    this.normals = []; // normals to the prism edges
    this.depth = 1; // allows user to create nested prisms which effectively create prisms with holes in them

    let clockwise = this.signedArea() < 0; // check if vertices are ordered clockwise
    // calculating normals for each edge of the prism
    for (let i = 0; i < this.vertices.length; i++) {
      let v1 = this.vertices[i];
      let v2 = this.vertices[(i + 1) % this.vertices.length]; // next vertex, with wrapping
      let edge = p5.Vector.sub(v2, v1); // vector pointing from v1 to v2
      let normal = clockwise
        ? this.p5_.createVector(edge.y, -edge.x) // rotate 90 degrees clockwise to get normal
        : this.p5_.createVector(-edge.y, edge.x); // rotate 90 degrees counter-clockwise to get normal
      normal.normalize(); // make it a unit vector
      this.normals.push(normal);
    }
  }

  flipNormals() {
    for (let i = 0; i < this.normals.length; i++) {
      this.normals[i].mult(-1);
    }
  }

  // Function to compute the signed area of the prism.
  // It's used to determine if vertices are ordered clockwise or counter-clockwise.
  signedArea() {
    let total = 0;
    for (let i = 0; i < this.vertices.length; i++) {
      let v1 = this.vertices[i];
      let v2 = this.vertices[(i + 1) % this.vertices.length]; // next vertex, with wrapping
      total += (v2.x - v1.x) * (v2.y + v1.y);
    }
    return total / 2;
  }

  // Function to draw the prism.
  draw() {
    this.p5_.noFill();
    this.p5_.stroke(255); // This sets the color of the edges to white.
    this.p5_.strokeWeight(2); // This makes the edges a bit thicker.
    this.p5_.beginShape();
    for (let v of this.vertices) {
      this.p5_.vertex(v.x, v.y);
    }
    this.p5_.endShape(this.p5_.CLOSE);
  }

  // Debugging function to check that the normals are oriented outwards from the prism
  drawNormals() {
    for (let i = 0; i < this.vertices.length; i++) {
      let v1 = this.vertices[i];
      let v2 = this.vertices[(i + 1) % this.vertices.length]; // next vertex, with wrapping
      let midpoint = p5.Vector.add(v1, v2).mult(0.5); // calculate midpoint
      let n = this.normals[i];
      let end = p5.Vector.add(midpoint, p5.Vector.mult(n, 20)); // Scale normal for visibility
      this.p5_.line(midpoint.x, midpoint.y, end.x, end.y);
    }
  }

  // Method to check if a given point (x, y) is inside the prism.
  // Uses ray-casting algorithm, commonly known as "even-odd rule".
  isInside(x, y) {
    let inside = false;
    for (
      let i = 0, j = this.vertices.length - 1;
      i < this.vertices.length;
      j = i++
    ) {
      let xi = this.vertices[i].x,
        yi = this.vertices[i].y;
      let xj = this.vertices[j].x,
        yj = this.vertices[j].y;

      let intersect =
        yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Method to get the normal of the face closest to a given point (x, y).
  // Useful for collision detection/resolution with the prism.
  getFaceNormal(x, y) {
    let point = this.p5_.createVector(x, y);
    let closestDist = Infinity;
    let closestIndex = -1;

    for (let i = 0; i < this.vertices.length; i++) {
      let v1 = this.vertices[i];
      let v2 = this.vertices[(i + 1) % this.vertices.length]; // next vertex, with wrapping

      let dist = this.distToFace(point, v1, v2);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }

    return this.normals[closestIndex];
  }

  // Function to compute the squared distance from a point to a face.
  distToFaceSquared(point, v, w) {
    const l2 = p5.Vector.dist(v, w);
    if (l2 === 0) return p5.Vector.dist(point, v);
    let t =
      ((point.x - v.x) * (w.x - v.x) + (point.y - v.y) * (w.y - v.y)) / l2 ** 2;

    t = Math.max(0, Math.min(1, t));
    return p5.Vector.dist(
      point,
      this.p5_.createVector(v.x + t * (w.x - v.x), v.y + t * (w.y - v.y))
    );
  }

  // Function to compute the distance from a point to a face.
  distToFace(point, v, w) {
    return Math.sqrt(this.distToFaceSquared(point, v, w));
  }

  // Adding a prism is more than just adding the prism to the prisms array. We need to check
  // whether the new prism encloses or is enclosed by another prism. If this is the case, then
  // a prism that once represented an area of refractive index different to vacuum might now represent
  // vacuum.
  static addPrism(newPrism) {
    // Compute depth level of the new prism. 0 denotes the canvas without any prisms in it.
    let newPrismDepth = 1;

    for (let existingPrism of prisms) {
      if (
        existingPrism.isInside(newPrism.vertices[0].x, newPrism.vertices[0].y)
      ) {
        // The new prisms "depth" is determined essentially by how many prisms it is inside of
        newPrismDepth = Math.max(newPrismDepth, existingPrism.depth + 1);
      }
    }

    newPrism.depth = newPrismDepth;

    // If the depth level is even, flip the normals. The default is that prism normals are
    // oriented outwards, but if thw new prism essentially represents hole then it's normals
    // need to be flipped because this new prism essentially represents a glass/air boundary
    if (newPrismDepth % 2 == 0) {
      newPrism.flipNormals();
    }

    // Check if newPrism encloses any existing prisms and update their depths and normals.
    for (let existingPrism of prisms) {
      if (
        newPrism.isInside(
          existingPrism.vertices[0].x,
          existingPrism.vertices[0].y
        )
      ) {
        existingPrism.depth += 1;
        existingPrism.flipNormals();
      }
    }

    prisms.push(newPrism);
  }

  static delete(prismIndex) {
    prisms.splice(prismIndex, 1);
    // Once removed, we need to update prisms in the URL
    storePrismsInUrl();
    // If we remove a nested prism, the normal vectors used in refraction will need to be recalculated
    // The easiest way to do this is the empty the prisms array and reload it from the url bar.
    prisms = [];
    p5Prisms.loadPrismsFromUrl();
    p5Prisms.clear();
  }
}

// Instantiate p5 sketch
let p5Prisms = new p5(sketchPrism);
