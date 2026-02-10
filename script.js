// const map = L.map('map').setView([28.6139, 77.2090], 15);

// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//   maxZoom: 19
// }).addTo(map);


// const GPS_INTERVAL_MS = 1000;
// const MIN_MOVE_METERS = 10;
// const ANIMATION_DELAY = 120;
// const MAX_ROUTE_POINTS = 500;

// const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImQ5MDQ0MzIwZTY4NTQxNWFiMWUxM2QwYWI3ZjQ1NTMzIiwiaCI6Im11cm11cjY0In0=";


// let watchId = null;
// let sensorInterval = null;
// let isTracking = false;

// let lastSnappedPoint = null;
// let marker = null;

// let animationToken = 0;

// const polyline = L.polyline([], {
//   color: 'blue',
//   weight: 4
// }).addTo(map);


// const startBtn = document.getElementById("startBtn");
// const stopBtn = document.getElementById("stopBtn");
// const latEl = document.getElementById("lat");
// const lngEl = document.getElementById("lng");


// function metersBetween(a, b) {
//   const R = 6371000;
//   const dLat = (b[0] - a[0]) * Math.PI / 180;
//   const dLng = (b[1] - a[1]) * Math.PI / 180;
//   const lat1 = a[0] * Math.PI / 180;
//   const lat2 = b[0] * Math.PI / 180;

//   const x =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(lat1) * Math.cos(lat2) *
//     Math.sin(dLng / 2) ** 2;

//   return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
// }


// function moveMarkerAlongPath(path) {
//   if (!path || path.length === 0) return;

//   animationToken++;
//   const token = animationToken;
//   let i = 0;

//   function step() {
//     if (!isTracking || token !== animationToken || i >= path.length) return;

//     marker.setLatLng(path[i]);
//     polyline.addLatLng(path[i]);

//     latEl.textContent = path[i][0].toFixed(6);
//     lngEl.textContent = path[i][1].toFixed(6);

//     i++;
//     setTimeout(step, ANIMATION_DELAY);
//   }

//   step();
// }


// async function snapToRoad(lat, lng) {
//   try {
//     const res = await fetch(
//       "https://api.openrouteservice.org/v2/snap/driving-car",
//       {
//         method: "POST",
//         headers: {
//           "Authorization": ORS_API_KEY,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           locations: [[lng, lat]]
//         })
//       }
//     );

//     const data = await res.json();

//     if (!data.locations?.length) throw new Error();

//     return [
//       data.locations[0].location[1],
//       data.locations[0].location[0]
//     ];
//   } catch {
//     return [lat, lng];
//   }
// }


// async function getRoute(from, to) {
//   try {
//     const res = await fetch(
//       "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
//       {
//         method: "POST",
//         headers: {
//           "Authorization": ORS_API_KEY,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           coordinates: [
//             [from[1], from[0]],
//             [to[1], to[0]]
//           ]
//         })
//       }
//     );

//     const data = await res.json();

//     if (!data.features?.length) throw new Error();

//     return data.features[0].geometry.coordinates
//       .slice(0, MAX_ROUTE_POINTS)
//       .map(c => [c[1], c[0]]);
//   } catch {
//     return [from, to];
//   }
// }


// async function handlePosition(lat, lng) {
//   if (!isTracking) return;

//   const snapped = await snapToRoad(lat, lng);

//   if (!marker) {
//     marker = L.marker(snapped).addTo(map);
//     polyline.addLatLng(snapped);
//     map.setView(snapped, 17);
//     lastSnappedPoint = snapped;
//     return;
//   }

//   if (metersBetween(lastSnappedPoint, snapped) < MIN_MOVE_METERS) return;

//   const path = await getRoute(lastSnappedPoint, snapped);

//   lastSnappedPoint = snapped;
//   moveMarkerAlongPath(path);
// }

// startBtn.addEventListener("click", () => {
//   if (isTracking) return;
//   isTracking = true;

//   watchId = navigator.geolocation.watchPosition(
//     pos => handlePosition(pos.coords.latitude, pos.coords.longitude),
//     () => {
//       sensorInterval = setInterval(() => {
//         navigator.geolocation.getCurrentPosition(
//           p => handlePosition(p.coords.latitude, p.coords.longitude),
//           () => {},
//           { enableHighAccuracy: true }
//         );
//       }, GPS_INTERVAL_MS);
//     },
//     { enableHighAccuracy: true }
//   );
// });

// stopBtn.addEventListener("click", () => {
//   isTracking = false;
//   animationToken++;

//   if (watchId) navigator.geolocation.clearWatch(watchId);
//   if (sensorInterval) clearInterval(sensorInterval);

//   watchId = null;
//   sensorInterval = null;
// });


const map = L.map('map').setView([28.6139, 77.2090], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);


const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImQ5MDQ0MzIwZTY4NTQxNWFiMWUxM2QwYWI3ZjQ1NTMzIiwiaCI6Im11cm11cjY0In0=";

const MIN_MOVE_METERS = 10;
const ROUTE_DELAY = 2500;

let watchId = null;
let isTracking = false;
let lastRouteTime = 0;

let marker = null;
let lastPoint = null;

const polyline = L.polyline([], { color: "blue" }).addTo(map);

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

async function getRoute(from, to) {

  try {

    const res = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: {
          "Authorization": ORS_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          coordinates: [
            [from[1], from[0]],
            [to[1], to[0]]
          ]
        })
      }
    );

    const data = await res.json();

    if (!data.features) {
      console.log("ORS route failed", data);
      return null;
    }

    return data.features[0].geometry.coordinates
      .map(c => [c[1], c[0]]);

  } catch (e) {
    console.log("Route error", e);
    return null;
  }
}

async function handlePosition(position) {

  if (!isTracking) return;

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  latEl.textContent = lat.toFixed(6);
  lngEl.textContent = lng.toFixed(6);

  const newPoint = [lat, lng];

  if (!marker) {
    marker = L.marker(newPoint).addTo(map);
    map.setView(newPoint, 17);
    lastPoint = newPoint;
    polyline.addLatLng(newPoint);
    return;
  }

  if (metersBetween(lastPoint, newPoint) < MIN_MOVE_METERS) return;

  if (Date.now() - lastRouteTime < ROUTE_DELAY) return;

  lastRouteTime = Date.now();

  const route = await getRoute(lastPoint, newPoint);

  if (route) {
    route.forEach(p => polyline.addLatLng(p));
    marker.setLatLng(route[route.length - 1]);
  } else {
    polyline.addLatLng(newPoint);
    marker.setLatLng(newPoint);
  }

  lastPoint = newPoint;
}

startBtn.onclick = () => {

  if (isTracking) return;

  isTracking = true;

  watchId = navigator.geolocation.watchPosition(
    handlePosition,
    console.error,
    { enableHighAccuracy: true }
  );
};


stopBtn.onclick = () => {

  isTracking = false;

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }
};
