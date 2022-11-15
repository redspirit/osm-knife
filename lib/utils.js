
const fs = require('fs');

const BS = (list, el, compareFn) => {
    let m = 0;
    let n = list.length - 1;
    while (m <= n) {
        let k = (n + m) >> 1;
        let cmp = compareFn(el, k);
        if (cmp > 0) {
            m = k + 1;
        } else if(cmp < 0) {
            n = k - 1;
        } else if (cmp === 0) {
            return k;
        }
    }
    return -m - 1;
}

const roundCoord = (num) => {
    const p = 10000000;
    return Math.round(num * p) / p;
}

const isClosedGeom = (geo) => {
    let coords = geo.coordinates ? geo.coordinates : geo;
    return coords[0].join(',') === coords[coords.length - 1].join(',');
}

const clipboard = (data) => {
    let proc = require('child_process').spawn('pbcopy');
    proc.stdin.write(JSON.stringify(data)); proc.stdin.end();
}

const saveToFile = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data));
}

const readFromFile = (file) => {
    return JSON.parse(fs.readFileSync(file).toString());
}

module.exports = {
    BS,
    roundCoord,
    isClosedGeom,
    clipboard,
    saveToFile,
    readFromFile
}