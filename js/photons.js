//photons.js

// Initialize the sketch with the p5 instance mode.
let sketchPhotons = function (p5_) {
  let photons; // An array to hold the individual photon objects
  const speed = 5; // A constant speed for the photons

  // The p5 setup function is called once when the program starts.
  // It's used to define initial environment properties.
  p5_.setup = function () {
    let canvas = p5_.createCanvas(p5_.windowWidth, p5_.windowHeight); // Create a canvas of specified width and height
    canvas.position(0, 0); // Position the canvas at the top left of the screen
    p5_.colorMode(p5_.RGB, 255, 255, 255, 100); // Set the color mode (RGB range from 0 to 255 and alpha range from 0 to 100)
    p5_.strokeCap(p5_.SQUARE); // Set the style of the line endings
    p5_.background(0); // Set the background color to black
    photons = []; // Initialize the array to hold photon objects

    // Initialize the photons
    // photons = p5_.createPhotons();
    p5_.loadReflectivityFromUrl();
    p5_.loadPhotonsFromUrl();
  };

  // The p5 draw function continuously executes the lines of code contained inside its block
  p5_.draw = function () {
    p5_.blendMode(p5_.ADD); // Set the blend mode to ADD (colors are added together)

    p5_.background(0);

    if (!isPaused) {
      // If the animation is not paused, update and display each photon
      photons.forEach((photon) => {
        photon.move(); // Update the photon's position
        photon.checkBoundaries(); // Check if the photon has hit the boundaries of the canvas
        photon.checkMedium(); // Check if the photon is inside the prism or not and handle the behavior accordingly
        photon.display(); // Display the photon
      });
    }
  };

  // p5 keyPressed function checks every time a key is pressed.
  p5_.keyPressed = function (e) {
    // If the key pressed was 's' or 'S', toggle the paused state
    if (p5_.key === "s" || p5_.key === "S") {
      isPaused = !isPaused;
    }
    // If the key pressed was 'r' or 'R', re-initialize the photons, clear the canvas and set the paused state to false
    if (p5_.key === "r" || p5_.key === "R") {
      p5_.restartPhotons();
    }
    // Clear the photons
    if (
      p5_.key === "c" ||
      p5_.key === "C" ||
      p5_.key === "o" ||
      p5_.key === "O"
    ) {
      p5_.clearPhotons();
    }
  };

  p5_.clearPhotons = function () {
    isPaused = true;
    photons = [];
    photonsInit = [];
    p5_.clear(); // Clear the pixels in the  canvas
    storePhotonsInUrl();
  };

  p5_.restartPhotons = function () {
    photons = [];
    p5_.clear();
    photonsInit.forEach((init) => {
      p5_.createPhotons(init[0], init[1]);
    });
    isPaused = true;
  };

  // Function to create the photons
  p5_.createPhotons = function (position, direction) {
    let u; // normalised velocity vector
    let pos; // starting position for the photons
    // Colors for the 6 different photons
    const colors = [
      [255, 0, 0], // red
      [255, 165, 0], // orange
      [255, 255, 0], // yellow
      [0, 255, 0], // green
      [0, 0, 255], // blue
      [128, 0, 128], // purple
    ];
    // Refractive indices for the 6 different photons
    const refrIndices = [
      1.51, // red
      1.52, // orange
      1.53, // yellow
      1.54, // green
      1.55, // blue
      1.56, // purple
    ];
    u = direction
      ? p5_.createVector(direction[0], direction[1]).normalize()
      : p5.Vector.fromAngle(0);

    pos = position ? position : [0, p5_.height / 2 - 30];

    colors.forEach((color, i) => {
      let p = new Photon(pos[0], pos[1], color, refrIndices[i]); // Create a new photon with the specified properties
      p.vel = u.copy().mult(speed); // Set the velocity of the photon based on the common angle and speed
      photons.push(p); // Add the photon to the array
      // Move and draw the photon just a little so users can see where the photons is going before they start the simulation
      p5_.blendMode(p5_.ADD);
      p.move();
      p.display();
      p.move();
      p.display();
      p.move();
      p.display();
    });

    return photons; // Return the array of photons
  };

  p5_.stringToPhotons = function (s) {
    let photonStrings = s.split("~");
    photonStrings.forEach((photonString) => {
      let parts = photonString.split("d");
      let position = parts[0].substring(1).split("_").map(Number); // We need to remove the leading 'p'
      let direction = parts[1].split("_").map(Number);
      p5_.createPhotons(position, direction);
      // Stores initial direction of photons so that we can restart the simulation and save data in the URL
      photonsInit.push([position, direction]);
    });
    return;
  };

  p5_.loadPhotonsFromUrl = function () {
    let params = new URLSearchParams(window.location.search);
    let photonString = params.get("photons");
    if (photonString) {
      try {
        p5_.stringToPhotons(photonString);
      } catch (e) {
        console.log(e);
        // Show a confirm dialog to the user
        let confirmed = confirm(
          "An error occurred while loading photons from the URL. Would you like to reload the page?"
        );
        if (confirmed) {
          // If the user clicks "OK", reload the page without any URL parameters
          window.location = window.location.pathname;
        }
        return;
      }
    }
  };

  p5_.loadReflectivityFromUrl = function () {
    let params = new URLSearchParams(window.location.search);
    let refString = params.get("ref");
    console.log(refString);
    if (refString) {
      reflectivity = parseFloat(refString);

      if (isNaN(reflectivity)) {
        // Show a confirm dialog to the user
        let confirmed = confirm(
          "An error occurred while loading reflectivity from the URL. Would you like to reload the page?"
        );
        if (confirmed) {
          // If the user clicks "OK", reload the page without any URL parameters
          window.location = window.location.pathname;
        }
      }
    }
  };

  // The Photon class
  class Photon {
    constructor(x, y, color, refIdx) {
      this.pos = p5_.createVector(x, y); // The position of the photon
      this.prevPos = this.pos.copy(); // The previous position of the photon (used for drawing the line)
      this.vel = p5_.createVector(0, 0); // The velocity of the photon
      this.diameter = 5; // The diameter of the photon (used for stroke weight when drawing)
      this.color = color; // The color of the photon
      this.inPrism = null; //  Which prism the photon is in
      this.depth = 0;
      this.refidx = refIdx; // The refractive index of the photon
      this.intensity = 100; //between 0 and 100. 0 is invisible. Adjusts every time photon reflects off boundary
    }

    // Function to update the photon's position
    move() {
      this.prevPos = this.pos.copy(); // Store the current position before updating it
      this.pos.add(this.vel); // Update the position based on the velocity
    }

    // Function to draw the photon
    display() {
      p5_.strokeWeight(this.diameter); // Set the stroke weight based on the photon's diameter
      p5_.stroke(this.color[0], this.color[1], this.color[2], this.intensity); // Set the stroke color based on the photon's color, set alpha value based on photo intensity
      p5_.line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y); // Draw a line from the previous position to the current position
    }

    // Function to check if the photon has hit the boundaries of the canvas and reflect it if so
    checkBoundaries() {
      if (this.pos.x > p5_.width - this.diameter / 2) {
        this.pos.x = p5_.width - this.diameter / 2;
        this.vel.x *= -1;
        this.intensity *= reflectivity;
      } else if (this.pos.x < this.diameter / 2) {
        this.pos.x = this.diameter / 2;
        this.vel.x *= -1;
        this.intensity *= reflectivity;
      }

      if (this.pos.y > p5_.height - this.diameter / 2) {
        this.pos.y = p5_.height - this.diameter / 2;
        this.vel.y *= -1;
        this.intensity *= reflectivity;
      } else if (this.pos.y < this.diameter / 2) {
        this.pos.y = this.diameter / 2;
        this.vel.y *= -1;
        this.intensity *= reflectivity;
      }
    }

    // Function to check if the photon is inside a prism and handle the behavior accordingly
    checkMedium() {
      let currentDepth = 0;
      let currentPrism = null;

      // Check every prism to find the one with the highest depth that the photon is inside of
      // There is some optimisation to be done here later
      for (let i = 0; i < prisms.length; i++) {
        const p = prisms[i];
        if (p.isInside(this.pos.x, this.pos.y)) {
          if (p.depth >= currentDepth) {
            currentDepth = p.depth;
            currentPrism = p;
          }
        }
      }

      // If the photon has crossed a prism boundary
      if (this.inPrism !== currentPrism) {
        // Get the normal vector to the face of the prism the photon is entering/exiting
        let n =
          currentDepth > this.depth
            ? currentPrism.getFaceNormal(this.pos.x, this.pos.y).copy() // entering
            : this.inPrism.getFaceNormal(this.pos.x, this.pos.y).copy(); // exiting

        // Normalize the velocity vector
        let u = this.vel.copy();
        u.normalize();

        let nRatio; // ratio of refractive indices

        if (currentDepth % 2 == 1) {
          // Transition from lower depth to higher depth
          nRatio = 1 / this.refidx;
        } else {
          // Transition from higher depth to lower depth or same depth to same depth
          nRatio = this.refidx;
          n.mult(-1); // Flip the normal vector
        }

        // Calculate the dot product between u and n
        let dt = u.dot(n);

        // Compute the discriminant (the part under the square root in the refract equation)
        let discr = 1.0 - nRatio * nRatio * (1.0 - dt * dt);

        if (discr > 0) {
          // Refraction is possible
          this.vel = p5.Vector.sub(
            p5.Vector.mult(u, nRatio),
            p5.Vector.mult(n, nRatio * dt + p5_.sqrt(discr))
          ).mult(speed);
        } else {
          // Total internal reflection, flip the velocity across the normal
          this.vel = p5.Vector.sub(
            this.vel,
            p5.Vector.mult(n, 2 * this.vel.dot(n))
          );
          // this.vel = p5_.createVector(0, 0);
        }
        this.inPrism = currentPrism; // Update the prism that the photon is inside of
        this.depth = currentDepth; // Update the photon's current depth
      }
    }
  }
};

// Create a new p5 instance using the sketch
let p5Photons = new p5(sketchPhotons);
