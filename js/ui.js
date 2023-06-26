// ui.js

// Define a new sketch
let sketchUI = function (p5_) {
  let drawingMode = false; // When true, taps and drags on screen create new prisms and photons
  // Keep track of whether the user is dragging which indicates the direction of new photons
  let deleteMode = false; // When true, taps on prisms will delete them from the canvas.

  let isDragging, startX, startY, endX, endY;
  // Declare an array to store points
  let points = [];

  let pressTimer, longPress; // determines if user does a press/click or long press/click

  let reflectivitySliderChanging = false; // keeps track of whether the user is adjusting the reactivity slider.

  let menuDiv, editPrismDiv; // Will contain DOM elements for UI

  let savePrismButton; // Will be attached to a draftPrism

  let draftPrismClosedOrOpen; // = p5_.CLOSE when prism is finished being made. This will draw the prism as a closed shape

  let draftPrismReady = false; // Prism created by user ready but not yet committed to the canvas

  // let twoFingerTouchAvgY = 0; //  used as part of the touchMove event to detect a two finger swipe up or down for scaling draft prisms

  let selectedVertexIndex = -1; // No vertex selected initially. This is used to allow users to rotate or scale their new prisms

  let canvas;

  // This function runs once during the program
  p5_.setup = function () {
    // Create a canvas element in the browser
    canvas = p5_.createCanvas(p5_.windowWidth, p5_.windowHeight);
    canvas.position(0, 0); // Position the canvas at the top-left corner
    p5_.colorMode(p5_.RGB, 255, 255, 255, 100); // Set the color mode to RGB and opacity from 0 to 100
    p5_.strokeCap(p5_.SQUARE); // Set the style for rendering line endings
    p5_.createMenu(); // Adds menu to allow user to control the app using clicks/taps

    // Instantiate a new Prism object using a regular polygon and add it to the prism array
    // Prism.addPrism(
    //   new Prism(
    //     p5_.regularPolygonPoints(
    //       p5_.width / 2,
    //       p5_.height / 2,
    //       p5_.min(p5_.width, p5_.height) * 0.25,
    //       3
    //     ) // Generate a regular polygon's vertices
    //   )
    // );

    function touched(e) {
      console.log("touch down");
      isDragging = false;
      pressTimer = setTimeout(function () {
        if (menuDiv.style("display") === "none") {
          menuDiv.style("display", "block");
          longPress = true;
          isPaused = true;
        }
      }, 800); // time (in milliseconds) to wait before considering it a long press

      // mouseX and mouseY won't work here because they only get registered on the end of the touch
      startX = e.changedTouches[0].clientX;
      startY = e.changedTouches[0].clientY;

      // New prism is ready, but we want to allow user to interact with the vertices to scale or rotate
      if (drawingMode && draftPrismReady) {
        // If the user clicks on a vertex, store the index
        for (let i = 0; i < points.length; i++) {
          let point = points[i];
          let d = p5_.dist(startX, startY, point.x, point.y);
          if (d < 20) {
            selectedVertexIndex = i;
            return;
          }
        }
      }
      return false;
    }

    function pressed(e) {
      console.log("mouse down");
      isDragging = false;
      pressTimer = setTimeout(function () {
        if (menuDiv.style("display") === "none") {
          menuDiv.style("display", "block");
          longPress = true;
          isPaused = true;
        }
      }, 800); // time (in milliseconds) to wait before considering it a long press
      startX = p5_.mouseX;
      startY = p5_.mouseY;

      // New prism is ready, but we want to allow user to interact with the vertices to scale or rotate
      if (drawingMode && draftPrismReady) {
        // If the user clicks on a vertex, store the index
        for (let i = 0; i < points.length; i++) {
          let point = points[i];
          let d = p5_.dist(startX, startY, point.x, point.y);
          if (d < 20) {
            selectedVertexIndex = i;
            return;
          }
        }
      }
      return false;
    }

    function released(e) {
      if (!drawingMode && !deleteMode & !longPress) {
        isPaused = !isPaused;
      }
      if (longPress) {
        longPress = false;
      }
      console.log("released");
      clearTimeout(pressTimer);
      selectedVertexIndex = -1; // We finished scaling/rotating a draft prism.
      if (isDragging) {
        p5Photons.createPhotons(
          [startX, startY],
          [endX - startX, endY - startY]
        );
        // Stores initial direction of photons so that we can restart the simulation and save data in the URL
        photonsInit.push([
          [startX, startY],
          [endX - startX, endY - startY],
        ]);
        storePhotonsInUrl();
      }
      return false;
    }

    if ("ontouchstart" in window) {
      canvas.touchStarted(touched);
      canvas.touchEnded(released);
    } else {
      canvas.mousePressed(pressed);
      canvas.mouseReleased(released);
    }

    // This function gets called every time a mouse button is pressed
    canvas.mouseClicked(function () {
      console.log("mouse click");
      if (isDragging) {
        isDragging = false;
        return;
      }
      if (drawingMode) {
        if (draftPrismReady) {
          return; // no click behaviour, we will be only be dragging prisms to move/rotate/scale
        } else {
          if (points.length > 2) {
            // Check if the clicked point is close to the first point of the shape being drawn
            let firstPoint = points[0];
            let d = p5_.dist(
              p5_.mouseX,
              p5_.mouseY,
              firstPoint.x,
              firstPoint.y
            );
            if (d < 20) {
              p5_.setDraftPrismReady(true);
              return;
            }
          }
          // If the click wasn't near the first point (or there are no points yet),
          // create a new point at the click location and add it to the points array
          points.push(p5_.createVector(p5_.mouseX, p5_.mouseY));
        }
      } else if (deleteMode) {
        let prismIndex = -1;
        let depth = 0;
        // Check every prism to find whether we've clicked inside of it. Because prisms can be nested
        // We have to use the "depth" parameter to find the "deepest" prism we are inside of
        for (let i = 0; i < prisms.length; i++) {
          const p = prisms[i];
          if (p.isInside(p5_.mouseX, p5_.mouseY)) {
            if (p.depth >= depth) {
              depth = p.depth;
              prismIndex = i;
            }
          }
        }

        if (prismIndex !== -1) {
          // we clicked inside of a prism, so delete it
          Prism.delete(prismIndex);
        }
      }
    });
  };

  p5_.mouseDragged = function () {
    isPaused = true;
    if (!drawingMode && !deleteMode && !reflectivitySliderChanging) {
      // This switches on the drawing of the photons
      console.log("is dragging");
      if (
        p5_.abs(p5_.mouseX - startX) > 5 ||
        p5_.abs(p5_.mouseY - startY) > 5
      ) {
        clearTimeout(pressTimer);
        isDragging = true;
        // isPaused = true;
      }
    } else if (drawingMode && draftPrismReady) {
      // This allows us to edit prisms that have recently been drafted
      if (selectedVertexIndex !== -1) {
        // User dragging on a vertex, so we should get ready to scale or rotate
        let centroid = p5_.calculateCentroid(points);
        let initialVector = p5.Vector.sub(
          points[selectedVertexIndex],
          centroid
        );
        let currentVector = p5.Vector.sub(
          p5_.createVector(p5_.mouseX, p5_.mouseY),
          centroid
        );

        let initialDistance = initialVector.mag();
        let currentDistance = currentVector.mag();
        let scaleFactor = currentDistance / initialDistance;

        let initialAngle = initialVector.heading();
        let currentAngle = currentVector.heading();
        let angleDifference = currentAngle - initialAngle;

        if (Math.abs(scaleFactor - 1) > 0.01) {
          // This is a threshold to detect a significant scaling
          points = p5_.scalePoints(points, scaleFactor, centroid);
        } else if (Math.abs(angleDifference) > 0.01) {
          // Threshold for significant rotation
          points = p5_.rotatePoints(points, angleDifference, centroid);
        }
      } else {
        // User dragging elsewhere on the canvas so we should move the prism
        endX = p5_.mouseX;
        endY = p5_.mouseY;
        moveVector = p5_.createVector(endX - startX, endY - startY);
        points = points.map((point) => {
          return p5.Vector.add(point, moveVector);
        });
        // need to reset the startX and startY position, otherwise the prism will accelerate off the canvas
        startX = p5_.mouseX;
        startY = p5_.mouseY;
      }
      savePrismButton.style("top", `${points[0].y + 20}px`);
      savePrismButton.style("left", `${points[0].x + 20}px`);
    }
  };

  // This function gets called repeatedly and it's where you draw things
  p5_.draw = function () {
    p5_.clear();
    p5_.noFill(); // No fill for shapes
    p5_.stroke(255); // Set line color to white
    p5_.strokeWeight(2); // Set line thickness to 2
    p5_.beginShape(); // Start creating a custom shape
    for (let v of points) {
      p5_.vertex(v.x, v.y); // Add vertex to the custom shape
      p5_.circle(v.x, v.y, 10); // Draw a circle for each vertex
    }
    p5_.endShape(draftPrismClosedOrOpen); // End of custom shape, can be open or closed.

    if (isDragging && p5_.mouseIsPressed) {
      endX = p5_.mouseX;
      endY = p5_.mouseY;
      photonDirection = p5_.createVector(endX - startX, endY - startY);
      p5_.line(startX, startY, endX, endY);
    }
  };

  p5_.calculateCentroid = function (vertices) {
    return vertices
      .reduce((acc, vertex) => {
        return acc.add(vertex);
      }, p5_.createVector(0, 0))
      .div(vertices.length);
  };

  p5_.scalePoints = function (points, scaleFactor, centroid) {
    return points.map((point) => {
      let diff = p5_.createVector(point.x - centroid.x, point.y - centroid.y);
      diff.mult(scaleFactor);
      return p5_.createVector(centroid.x + diff.x, centroid.y + diff.y);
    });
  };

  p5_.rotatePoints = function (points, angle, centroid) {
    let cosAngle = Math.cos(angle);
    let sinAngle = Math.sin(angle);

    return points.map((point) => {
      let diff = p5_.createVector(point.x - centroid.x, point.y - centroid.y);
      let rotatedX = diff.x * cosAngle - diff.y * sinAngle;
      let rotatedY = diff.x * sinAngle + diff.y * cosAngle;
      return p5_.createVector(centroid.x + rotatedX, centroid.y + rotatedY);
    });
  };

  p5_.commitNewPrism = function () {
    if (draftPrismReady) {
      // Validate if the shape is valid, i.e lines cannot cross each other
      let isValidShape = p5_.validateShape(points);
      if (isValidShape) {
        // Create a new Prism with the clicked points
        Prism.addPrism(new Prism(points));
        storePrismsInUrl();
        p5_.clearPrismPoints();
        p5_.setDraftPrismReady(false);
      } else {
        // If the shape is not valid, inform the user
        alert("Invalid shape! Lines cannot intersect.");
        console.error("Invalid shape! Lines cannot intersect.");
      }
    }
  };

  p5_.setDraftPrismReady = function (readyStatus) {
    if (draftPrismReady && readyStatus) {
      // Can happen if user decides to use pre-made circle, square or triangle after they've finished their draft
      savePrismButton.remove();
    }
    if (readyStatus) {
      draftPrismClosedOrOpen = p5_.CLOSE;

      savePrismButton = p5_.createButton("Save Prism");
      savePrismButton.mouseClicked((e) => {
        e.stopPropagation();
        p5_.commitNewPrism();
      });
      savePrismButton.style("position", "absolute");
      savePrismButton.style("top", `${points[0].y + 20}px`);
      savePrismButton.style("left", `${points[0].x + 20}px`);
      savePrismButton.style("display", "block");
    } else {
      draftPrismClosedOrOpen = null;
      if (savePrismButton) {
        savePrismButton.remove();
      }
    }
    draftPrismReady = readyStatus;
  };

  p5_.createTriangle = function () {
    points = p5_.regularPolygonPoints(
      p5_.width / 2,
      p5_.height / 2,
      p5_.min(p5_.width, p5_.height) * 0.25,
      3
    );
    p5_.setDraftPrismReady(true);
  };

  p5_.createCircle = function () {
    points = p5_.regularPolygonPoints(
      p5_.width / 2,
      p5_.height / 2,
      p5_.min(p5_.width, p5_.height) * 0.25,
      30
    );
    p5_.setDraftPrismReady(true);
  };

  p5_.createSquare = function () {
    points = p5_.regularPolygonPoints(
      p5_.width / 2,
      p5_.height / 2,
      p5_.min(p5_.width, p5_.height) * 0.25,
      4
    );
    p5_.setDraftPrismReady(true);
  };

  // Make sure canvas is always the same was as viewport
  p5_.windowResized = function () {
    p5_.resizeCanvas(p5_.windowWidth, p5_.windowHeight);
  };

  // This function gets called every time a key is pressed
  p5_.keyPressed = function (e) {
    const numericRegex = /^[0-9]+$/; // Regex pattern to check if the pressed key is a number
    if (numericRegex.test(p5_.key)) {
      const newNumSides = parseInt(p5_.key);
      if (newNumSides <= 9 && newNumSides >= 3) {
        // Adds a new Prism with the number of sides equal to the number pressed
        points = p5_.regularPolygonPoints(
          p5_.width / 2,
          p5_.height / 2,
          p5_.min(p5_.width, p5_.height) * 0.25,
          newNumSides
        );

        let isValidShape = p5_.validateShape(points);
        if (isValidShape) {
          // Create a new Prism with the clicked points
          Prism.addPrism(new Prism(points));
          storePrismsInUrl();
          p5_.clearPrismPoints();
        } else {
          // If the shape is not valid, inform the user
          alert("Invalid shape! Lines cannot intersect.");
          console.error("Invalid shape! Lines cannot intersect.");
        }
      }
    } else {
      if (p5_.key === "u" || p5_.key === "U") {
        p5_.undoPoint();
      }
      if (p5_.key === "c" || p5_.key === "C") {
        p5_.clearPrismPoints();
      }
    }
  };

  p5_.undoPoint = function () {
    p5_.setDraftPrismReady(false);
    points.pop(); // Remove the last point in the points array
    p5_.clear(); // Clear the pixels in the main canvas
  };

  p5_.clearPrismPoints = function () {
    isPaused = true;
    points = [];
    p5_.clear(); // Clear the pixels in the  canvas
  };

  p5_.createMenu = function () {
    menuDiv = p5_.createDiv();
    menuDiv.style("position", "absolute");
    menuDiv.style("top", "10px");
    menuDiv.style("left", "10px");
    menuDiv.style("display", "none");

    editPrismDiv = p5_.createDiv();
    editPrismDiv.style("display", "none");
    editPrismDiv.parent(menuDiv);

    undoButton = p5_.createButton("Undo");
    undoButton.mouseClicked((e) => {
      p5_.undoPoint();
    });
    undoButton.parent(editPrismDiv);

    triangleButton = p5_.createButton("Triangle");
    triangleButton.mouseClicked((e) => {
      p5_.createTriangle();
    });
    triangleButton.parent(editPrismDiv);

    circleButton = p5_.createButton("Circle");
    circleButton.mouseClicked((e) => {
      p5_.createCircle();
    });
    circleButton.parent(editPrismDiv);

    squareButton = p5_.createButton("Square");
    squareButton.mouseClicked((e) => {
      p5_.createSquare();
    });
    squareButton.parent(editPrismDiv);

    prismToggle = p5_.createCheckbox("Create Prism Mode", false);

    prismToggle.changed((e) => {
      drawingMode = prismToggle.checked();
      // Note, there is something a bit weird about checkboxes in p5. When you click on the label
      // the checkbox changes twice. The code below is to mitigate this to some degree. I'll need to revisit
      // this later
      if (!drawingMode) {
        // Clear any unfinished prisms if user switches off drawing mode
        points = [];
        p5_.clear(); // Clear the pixels in the canvas
        editPrismDiv.style("display", "none");
        p5_.setDraftPrismReady(false);
      } else {
        isPaused = true; // Pause the simulation
        editPrismDiv.style("display", "block");
        deleteToggle.checked(false);
        deleteToggle.elt.dispatchEvent(new Event("change"));
      }
    });
    prismToggle.parent(menuDiv);

    deleteToggle = p5_.createCheckbox("Delete Prism Mode", false);

    deleteToggle.changed((e) => {
      deleteMode = deleteToggle.checked();
      if (deleteMode) {
        isPaused = true; // Pause the simulation
        prismToggle.checked(false);
        prismToggle.elt.dispatchEvent(new Event("change"));
        p5_.cursor(p5_.CROSS);
      } else {
        p5_.cursor(p5_.ARROW);
      }
    });
    deleteToggle.parent(menuDiv);

    reflectivitySlider = p5_.createSlider(0, 1, reflectivity, 0.1);
    reflectivitySlider.changed((e) => {
      // Change global reflectivity variable to the slider value
      reflectivity = reflectivitySlider.value();
      storeReflectionInUrl();
    });

    reflectivitySlider.mousePressed((e) => {
      // stop photon from being created by dragging the slider
      // unfortunately there is no mouseDragged for the slider that I can stopPropagation on
      reflectivitySliderChanging = true;
    });
    reflectivitySlider.mouseReleased((e) => {
      // stop photon from being created by dragging the slider
      // unfortunately there is no mouseDragged for the slider that I can stopPropagation on
      reflectivitySliderChanging = false;
    });

    reflectivitySlider.touchMoved((e) => {
      // stop photon from being created by dragging the slider on mobile
      e.stopPropagation();
    });

    reflectivitySlider.parent(menuDiv);

    hideButton = p5_.createButton("Hide controls");
    hideButton.mouseClicked((e) => {
      menuDiv.style("display", "none");
    });
    hideButton.parent(menuDiv);

    clearPhotonsButton = p5_.createButton("Clear light rays");

    clearPhotonsButton.mousePressed((e) => {
      p5Photons.clearPhotons();
    });

    clearPhotonsButton.parent(menuDiv);

    clearPrismsButton = p5_.createButton("Clear prisms");
    clearPrismsButton.mouseClicked((e) => {
      p5Prisms.clearPrisms();
      p5_.clearPrismPoints();
    });
    clearPrismsButton.parent(menuDiv);

    restartSimulationButton = p5_.createButton("Restart simulation");
    restartSimulationButton.mouseClicked((e) => {
      p5Photons.restartPhotons();
    });
    restartSimulationButton.parent(menuDiv);

    for (let child of menuDiv.elt.children) {
      child.style.color = "white";
      child.style.background = "black";
    }
  };

  // A valid shape is one in which lines don't cross each other. That includes comparing lines
  // between prisms. A new prism cannot cross over another.
  p5_.validateShape = function (points) {
    // Generate array of lines
    let lines = [];
    for (let i = 0; i < points.length; i++) {
      let line = [points[i], points[(i + 1) % points.length]];
      lines.push(line);
    }

    // Check each pair of lines for intersection in a newly proposed prism
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        if (p5_.lineIntersection(lines[i], lines[j])) {
          return false; // Invalid shape: lines intersect
        }
      }
    }

    // Create array of lines for each prism
    let prismLines = [];
    prisms.forEach((prism) => {
      for (let i = 0; i < prism.vertices.length; i++) {
        let line = [
          prism.vertices[i],
          prism.vertices[(i + 1) % prism.vertices.length],
        ];
        prismLines.push(line);
      }
    });

    // Interprism check, do lines of newly proposed prism cross an existing one.
    for (let i = 0; i < lines.length; i++) {
      for (let j = 0; j < prismLines.length; j++) {
        if (p5_.lineIntersection(lines[i], prismLines[j])) {
          return false; // Invalid shape: lines intersect
        }
      }
    }

    return true; // Valid shape: no lines intersect
  };

  // Function to check if two lines intersect
  p5_.lineIntersection = function (line1, line2) {
    // Extract coordinates from the line segments
    let x1 = line1[0].x,
      y1 = line1[0].y,
      x2 = line1[1].x,
      y2 = line1[1].y;
    let x3 = line2[0].x,
      y3 = line2[0].y,
      x4 = line2[1].x,
      y4 = line2[1].y;

    // Check if the lines share a point and skip intersection check if they do
    if (
      (x1 === x3 && y1 === y3) ||
      (x2 === x4 && y2 === y4) ||
      (x1 === x4 && y1 === y4) ||
      (x2 === x3 && y2 === y3)
    ) {
      return false;
    }

    // Compute the denominator
    let denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

    if (denom === 0) {
      // Lines are parallel
      return false;
    }

    // Calculate the parameters for the intersection point
    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      // Intersection detected within the line segments
      return true;
    }

    // No intersection
    return false;
  };

  // Function to create vertices of a regular polygon
  p5_.regularPolygonPoints = function (x, y, radius, npoints) {
    let angle = p5_.TWO_PI / npoints;
    let vertices = [];

    // Calculate the vertices
    for (let a = 0; a < p5_.TWO_PI; a += angle) {
      let sx = x + p5_.cos(a) * radius;
      let sy = y + p5_.sin(a) * radius;
      vertices.push(p5_.createVector(sx, sy));
    }
    return vertices;
  };
};

// Instantiate the p5 object
let p5UI = new p5(sketchUI);
