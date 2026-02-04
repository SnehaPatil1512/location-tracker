// let map = L.map('map').setView([28.6139, 77.2090], 15);
// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//   maxZoom: 19
// }).addTo(map);

// let watchId = null;
// let sensorInterval = null;
// let isTracking = false;
// let isAnimating = false;

// let lastSnappedPoint = null;
// let fullPath = [];
// let marker = null;

// let polyline = L.polyline([], { color: 'blue', weight: 4 }).addTo(map);

// const startBtn = document.getElementById("startBtn");
// const stopBtn = document.getElementById("stopBtn");
// const latEl = document.getElementById("lat");
// const lngEl = document.getElementById("lng");


// let animationTimeout = null;

// function moveMarkerAlongPath(marker, path, delay = 100) {
//   if (!path || path.length === 0) return;


//   isAnimating = true;
//   if (animationTimeout) {
//     clearTimeout(animationTimeout);
//   }

//   let i = 0;
//   function step() {
//     if (!isTracking || !isAnimating || i >= path.length) return;

//     marker.setLatLng(path[i]);
//     polyline.addLatLng(path[i]);
//     map.panTo(path[i]);
//     latEl.textContent = path[i][0].toFixed(6);
//     lngEl.textContent = path[i][1].toFixed(6);

//     i++;
//     animationTimeout = setTimeout(step, delay);
//   }

//   step();
// }

// async function handlePosition(lat, lng) {
//   try {
//     const snapUrl = `https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}?number=1`;
//     const snapRes = await fetch(snapUrl);
//     const snapData = await snapRes.json();

//     const snapped = [
//       snapData.waypoints[0].location[1],
//       snapData.waypoints[0].location[0]
//     ];

//     if (!marker) {
//       lastSnappedPoint = snapped;
//       fullPath.push(snapped);
//       marker = L.marker(snapped).addTo(map);
//       polyline.addLatLng(snapped);
//       map.setView(snapped, 17);
//       latEl.textContent = snapped[0].toFixed(6);
//       lngEl.textContent = snapped[1].toFixed(6);
//       return;
//     }

//     const routeUrl = `https://router.project-osrm.org/route/v1/driving/` +
//       `${lastSnappedPoint[1]},${lastSnappedPoint[0]};` +
//       `${snapped[1]},${snapped[0]}?overview=full&geometries=geojson`;

//     const routeRes = await fetch(routeUrl);
//     const routeData = await routeRes.json();

//     const roadCoords = routeData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);

//     lastSnappedPoint = snapped;

//     moveMarkerAlongPath(marker, roadCoords, 100);

//   } catch (err) {
//     console.error("Routing error:", err);
//   }
// }

// startBtn.addEventListener("click", () => {
//   if (isTracking) return;
//   isTracking = true;

//   watchId = navigator.geolocation.watchPosition(
//     pos => handlePosition(pos.coords.latitude, pos.coords.longitude),
//     err => {
//       console.warn("watchPosition failed, switching to interval mode", err);
//       if (!sensorInterval) {
//         sensorInterval = setInterval(() => {
//           navigator.geolocation.getCurrentPosition(
//             pos => handlePosition(pos.coords.latitude, pos.coords.longitude),
//             e => console.error("Sensor GPS error:", e),
//             { enableHighAccuracy: true }
//           );
//         }, 1000);
//       }
//     },
//     { enableHighAccuracy: true, timeout: 10000 }
//   );
// });

// stopBtn.addEventListener("click", () => {
//   isTracking = false;
//   isAnimating = false;
 
//   if (watchId) {
//     navigator.geolocation.clearWatch(watchId);
//     watchId = null;
//   }

//   if (sensorInterval) {
//     clearInterval(sensorInterval);
//     sensorInterval = null;
//   }

//   if (animationTimeout) {
//     clearTimeout(animationTimeout);
//     animationTimeout = null;
//   }

//   lastSnappedPoint = null;
//   fullPath = [];
//   polyline.setLatLngs([]);
//   if (marker) {
//     map.removeLayer(marker);
//     marker = null;
//   }

//   latEl.textContent = "-";
//   lngEl.textContent = "-";

//   alert("Tracking stopped");
// });



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

