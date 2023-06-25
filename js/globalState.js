//globalState.js

// A boolean that checks if the sketch is paused or not.
let isPaused = true;

// Holds instances of the Prism class to be shared amongst the different p5 instances
let prisms = [];

// Holds initial position and directions of the photons created
let photonsInit = [];

// Photon reflectivity off boundaries
let reflectivity = 0.9; // 1 = boundaries reflect perfectly, 0 = boundaries are transparent

function prismsToString() {
  return prisms
    .map((prism) => {
      return prism.vertices
        .map((point) => point.x.toFixed(2) + "_" + point.y.toFixed(2))
        .join("-");
    })
    .join("~");
}

function reflectivityToString() {
  return reflectivity;
}

function photonsToString() {
  return photonsInit
    .map((init) => {
      return `p${init[0][0].toFixed(2)}_${init[0][1].toFixed(
        2
      )}d${init[1][0].toFixed(2)}_${init[1][1].toFixed(2)}`;
    })
    .join("~");
}

function storePrismsInUrl() {
  let params = new URLSearchParams(window.location.search);
  const prismString = prismsToString();
  if (prismString) {
    params.set("prisms", prismString);
  } else {
    params.delete("prisms");
  }

  window.history.replaceState({}, "", "?" + params.toString());
}

function storeReflectionInUrl() {
  let params = new URLSearchParams(window.location.search);
  const refString = reflectivityToString();
  if (refString) {
    params.set("ref", refString);
  } else {
    params.delete("ref");
  }
  window.history.replaceState({}, "", "?" + params.toString());
}

function storePhotonsInUrl() {
  let params = new URLSearchParams(window.location.search);
  const photonString = photonsToString();
  if (photonString) {
    params.set("photons", photonString);
  } else {
    params.delete("photons");
  }
  window.history.replaceState({}, "", "?" + params.toString());
}
