// const map = L.map('map').setView([28.6139, 77.2090], 15);

// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//   maxZoom: 19
// }).addTo(map);


// const GPS_INTERVAL_MS = 1000;
// const MIN_MOVE_METERS = 10;
// const ANIMATION_DELAY = 120;
// const MAX_ROUTE_POINTS = 500;


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


const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImQ5MDQ0MzIwZTY4NTQxNWFiMWUxM2QwYWI3ZjQ1NTMzIiwiaCI6Im11cm11cjY0In0=";

let map = L.map('map').setView([20,78],5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let marker = null;
let polyline = L.polyline([], {color:'blue'}).addTo(map);

let watchId = null;
let lastPoint = null;
let fullRoute = [];
let routingLock = false;

function haversine(p1,p2){
    const R = 6371000;
    const toRad = x => x * Math.PI / 180;

    const dLat = toRad(p2.lat - p1.lat);
    const dLng = toRad(p2.lng - p1.lng);

    const a =
        Math.sin(dLat/2)**2 +
        Math.cos(toRad(p1.lat)) *
        Math.cos(toRad(p2.lat)) *
        Math.sin(dLng/2)**2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

async function getRoute(start,end){

    const res = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
            method:"POST",
            headers:{
                "Authorization": ORS_API_KEY,
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                coordinates:[
                    [start.lng,start.lat],
                    [end.lng,end.lat]
                ]
            })
        }
    );

    const data = await res.json();
    const coords = data.features[0].geometry.coordinates;

    return coords.map(c => [c[1],c[0]]);
}

navigator.geolocation.getCurrentPosition(pos => {

    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    map.setView([lat,lng],15);

    marker = L.marker([lat,lng]).addTo(map);

    lastPoint = {lat,lng};
});

function startTracking(){

    watchId = navigator.geolocation.watchPosition(
        updateLocation,
        ()=>{},
        {enableHighAccuracy:true}
    );
}

async function updateLocation(position){

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    const currentPoint = {lat,lng};

    if(marker) marker.setLatLng([lat,lng]);

    map.setView([lat,lng],16);

    if(!lastPoint) return;

    if(haversine(lastPoint,currentPoint) < 25) return;

    if(routingLock) return;

    routingLock = true;

    try{

        const segment = await getRoute(lastPoint,currentPoint);

        if(fullRoute.length === 0){
            fullRoute = segment;
        } else {
            segment.shift();
            fullRoute = fullRoute.concat(segment);
        }

        polyline.setLatLngs(fullRoute);

        lastPoint = currentPoint;

    } catch(e){
        console.log(e);
    }

    routingLock = false;
}

function stopTracking(){
    if(watchId){
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}
