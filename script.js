const map = L.map('map').setView([28.6139, 77.2090], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);


const GPS_INTERVAL_MS = 1000;
const MIN_MOVE_METERS = 10;
const ANIMATION_DELAY = 120;
const MAX_ROUTE_POINTS = 500;


let watchId = null;
let sensorInterval = null;
let isTracking = false;

let lastSnappedPoint = null;
let marker = null;

let animationToken = 0;

const polyline = L.polyline([], {
  color: 'blue',
  weight: 4
}).addTo(map);


const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const latEl = document.getElementById("lat");
const lngEl = document.getElementById("lng");


function metersBetween(a, b) {
  const R = 6371000;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const lat1 = a[0] * Math.PI / 180;
  const lat2 = b[0] * Math.PI / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}


function moveMarkerAlongPath(path) {
  if (!path || path.length === 0) return;

  animationToken++;
  const token = animationToken;
  let i = 0;

  function step() {
    if (!isTracking || token !== animationToken || i >= path.length) return;

    marker.setLatLng(path[i]);
    polyline.addLatLng(path[i]);

    latEl.textContent = path[i][0].toFixed(6);
    lngEl.textContent = path[i][1].toFixed(6);

    i++;
    setTimeout(step, ANIMATION_DELAY);
  }

  step();
}


async function snapToRoad(lat, lng) {
  try {
    const url = `https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}?number=1`;
    const res = await fetch(url);
    const data = await res.json();

    return [
      data.waypoints[0].location[1],
      data.waypoints[0].location[0]
    ];
  } catch {
    return [lat, lng];
  }
}

async function getRoute(from, to) {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from[1]},${from[0]};${to[1]},${to[0]}` +
      `?overview=full&geometries=geojson`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes?.length) throw new Error();

    return data.routes[0].geometry.coordinates
      .slice(0, MAX_ROUTE_POINTS)
      .map(c => [c[1], c[0]]);
  } catch {
    return [from, to];
  }
}

async function handlePosition(lat, lng) {
  if (!isTracking) return;

  const snapped = await snapToRoad(lat, lng);

  if (!marker) {
    marker = L.marker(snapped).addTo(map);
    polyline.addLatLng(snapped);
    map.setView(snapped, 17);
    lastSnappedPoint = snapped;
    return;
  }

  if (metersBetween(lastSnappedPoint, snapped) < MIN_MOVE_METERS) return;

  const path = await getRoute(lastSnappedPoint, snapped);

  lastSnappedPoint = snapped;
  moveMarkerAlongPath(path);
}

startBtn.addEventListener("click", () => {
  if (isTracking) return;
  isTracking = true;

  watchId = navigator.geolocation.watchPosition(
    pos => handlePosition(pos.coords.latitude, pos.coords.longitude),
    () => {
      sensorInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          p => handlePosition(p.coords.latitude, p.coords.longitude),
          () => {},
          { enableHighAccuracy: true }
        );
      }, GPS_INTERVAL_MS);
    },
    { enableHighAccuracy: true }
  );
});

stopBtn.addEventListener("click", () => {
  isTracking = false;
  animationToken++;

  if (watchId) navigator.geolocation.clearWatch(watchId);
  if (sensorInterval) clearInterval(sensorInterval);

  watchId = null;
  sensorInterval = null;
});


// const map = L.map('map').setView([28.6139, 77.2090], 15);

// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//   maxZoom: 19
// }).addTo(map);

// const GPS_INTERVAL_MS = 1000;
// const ANIMATION_DELAY = 120;
// const MAX_ROUTE_POINTS = 500;
// const SMOOTHING_WINDOW = 3;

// let watchId = null;
// let sensorInterval = null;
// let isTracking = false;
// let lastSnappedPoint = null;
// let marker = null;
// let animationToken = 0;
// let recentPositions = [];

// const polyline = L.polyline([], {
//   color: 'blue',
//   weight: 4
// }).addTo(map);

// const startBtn = document.getElementById("startBtn");
// const stopBtn = document.getElementById("stopBtn");
// const latEl = document.getElementById("lat");
// const lngEl = document.getElementById("lng");

// function smoothPosition(newPos) {
//   recentPositions.push(newPos);
//   if (recentPositions.length > SMOOTHING_WINDOW) recentPositions.shift();

//   const avgLat = recentPositions.reduce((sum, p) => sum + p[0], 0) / recentPositions.length;
//   const avgLng = recentPositions.reduce((sum, p) => sum + p[1], 0) / recentPositions.length;

//   return [avgLat, avgLng];
// }

// async function snapToRoad(lat, lng) {
//   try {
//     const url = `https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}?number=1`;
//     const res = await fetch(url);
//     const data = await res.json();

//     return [
//       data.waypoints[0].location[1],
//       data.waypoints[0].location[0]
//     ];
//   } catch {
//     return [lat, lng];
//   }
// }

// async function getRoute(from, to) {
//   try {
//     const url =
//       `https://router.project-osrm.org/route/v1/driving/` +
//       `${from[1]},${from[0]};${to[1]},${to[0]}` +
//       `?overview=full&geometries=geojson`;

//     const res = await fetch(url);
//     const data = await res.json();

//     if (!data.routes?.length) throw new Error();

//     return data.routes[0].geometry.coordinates
//       .slice(0, MAX_ROUTE_POINTS)
//       .map(c => [c[1], c[0]]);
//   } catch {
//     return [from, to];
//   }
// }

// function moveMarkerAlongPath(path) {
//   if (!path || path.length === 0) return;

//   animationToken++;
//   const token = animationToken;
//   let i = 0;

//   function step() {
//     if (!isTracking || token !== animationToken || i >= path.length) return;

//     const nextPoint = path[i];

//     marker.setLatLng(nextPoint);
//     polyline.addLatLng(nextPoint);

//     latEl.textContent = nextPoint[0].toFixed(6);
//     lngEl.textContent = nextPoint[1].toFixed(6);

//     i++;
//     setTimeout(step, ANIMATION_DELAY);
//   }

//   step();
// }

// async function handlePosition(lat, lng) {
//   if (!isTracking) return;

//   let snapped = await snapToRoad(lat, lng);
//   snapped = smoothPosition(snapped);

//   if (!marker) {
//     marker = L.marker(snapped).addTo(map);
//     polyline.addLatLng(snapped);
//     map.setView(snapped, 17);
//     lastSnappedPoint = snapped;
//     return;
//   }

//   const path = await getRoute(lastSnappedPoint, snapped);
//   lastSnappedPoint = snapped;
//   moveMarkerAlongPath(path);
// }

// startBtn.addEventListener("click", () => {
//   if (isTracking) return;

//   isTracking = true;

//   if (navigator.geolocation) {
//     watchId = navigator.geolocation.watchPosition(
//       pos => handlePosition(pos.coords.latitude, pos.coords.longitude),
//       err => console.warn("GPS error:", err),
//       { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
//     );
//   } else {
//     alert("Geolocation not supported on this device.");
//   }

//   console.log("Tracking started");
// });

// stopBtn.addEventListener("click", () => {
//   if (!isTracking) return;

//   isTracking = false;
//   animationToken++; 

//   if (watchId !== null) {
//     navigator.geolocation.clearWatch(watchId);
//     watchId = null;
//   }

//   if (sensorInterval !== null) {
//     clearInterval(sensorInterval);
//     sensorInterval = null;
//   }

//   console.log("Tracking stopped");
// });
