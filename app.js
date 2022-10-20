
const fs = require('fs/promises');
const through = require('through2');
const parseOSM = require('./parser');

// const osm = parseOSM();
// let index = {};


const readData = (fd, start, callback) => {
    const stream = fd.createReadStream({start})
        .pipe(new parseOSM.BlobParser())
        .pipe(new parseOSM.BlobDecompressor())
        .pipe(new parseOSM.PrimitivesParser())
        .pipe(through.obj((data, enc, next) => {
            callback(data);
            stream.destroy();
        }));
}

const createIndex = (inputFile, outputFile) => {

    const nodes = {addr: [], idx: []};
    const ways = {addr: [], idx: []};
    const relations = {addr: [], idx: []};
    let progress = 0;
    let progressOld = 0;

    return new Promise(async (resolve, reject) => {

        const fd = await fs.open(inputFile, 'r');
        const stat = await fd.stat();

        fd.createReadStream()
            .pipe(parseOSM())
            .pipe(through.obj((data, enc, next) => {

                let first = data.items[0];
                let last = data.items[data.items.length - 1];

                if(first.type === 'node') {
                    nodes.addr.push(data.offset);
                    nodes.idx.push([first.id, last.id]);
                }
                if(first.type === 'way') {
                    ways.addr.push(data.offset);
                    ways.idx.push([first.id, last.id]);
                }
                if(first.type === 'relation') {
                    relations.addr.push(data.offset);
                    relations.idx.push([first.id, last.id]);
                }

                progress = Math.round(data.offset / stat.size * 100);
                if(progress !== progressOld) {
                    console.log(`Create index: ${progress}%`);
                    progressOld = progress;
                }

                next();
            }))
            .on('finish', async () => {
                await fd.close();
                await fs.writeFile(outputFile, JSON.stringify({nodes, ways, relations}));
                resolve();
            });
    })

}

const loadIndex = async (indexFile) => {
    const buf = await fs.readFile(indexFile);
    return JSON.parse(buf.toString());
}

const findAddressById = (index, type, targetId) => {

    let collection = [];
    if(type === 'node') {
        collection = index.nodes;
    }
    if(type === 'way') {
        collection = index.ways;
    }
    if(type === 'relation') {
        collection = index.relations;
    }

    let ind = BS(collection.addr, targetId, (id, k) => {
        let startEnd = collection.idx[k]
        if(id < startEnd[0]) return -1;
        if(id > startEnd[1]) return 1;
        if(id >= startEnd[0] && id <= startEnd[1]) {
            return 0
        } else {
            return null;
        }
    })

    return ind ? collection.addr[ind] : null;

    // id 1637830059

}

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
        } else {
            return null;
        }
    }
    return -m - 1;
}

(async () => {

    const file1 = 'D:/osrm/pbf/belarus-latest.osm.pbf';
    // const file2 = 'D:/osrm/pbf/_test.pbf';
    // const file2 = 'D:/osrm/pbf/_test.pbf';
    const indexFile = 'D:/osrm/pbf/bel.index';

    let ind = await loadIndex(indexFile);
    const targetId = 189527182;
    let address = findAddressById(ind, 'way', targetId);
    console.log('Finded address', address);

    const fd = await fs.open(file1, 'r');
    readData(fd, address, (data) => {
        data.items.forEach(item => {
            if(item.id === targetId) {
                console.log('Found:', item);
            }
        })
        // console.log(data);
    });
    return 1;

    // await createIndex(file1, indexFile);
    // console.log('ok');
    // return 1;

})()

