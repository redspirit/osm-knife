
const s2 = require('@radarlabs/s2');

// an array of lat/lng pairs representing a region (a part of Brooklyn, in this case)
const loopLLs = [[40.70113825399865,-73.99229764938354],[40.70113825399865,-73.98766279220581],
    [40.70382234072197,-73.98766279220581],[40.70382234072197,-73.99229764938354]];

// map to an array of normalized s2.LatLng
const s2LLs = loopLLs.map(([lat, lng]) => (new s2.LatLng(lat, lng)));

// generate s2 cells to cover this polygon
const s2level = 14;
const covering = s2.RegionCoverer.getCoveringTokens(s2LLs, { min: s2level, max: s2level });
covering.forEach(c => console.log(c));

// check if a point is contained inside this region
const point = new s2.CellId(new s2.LatLng(40.70248844447621, -73.98991584777832));
const pointAtLevel14 = point.parent(s2level);
console.log('point', pointAtLevel14.token());

const coveringSet = new Set(covering);
console.log(coveringSet.has(pointAtLevel14.token()));
