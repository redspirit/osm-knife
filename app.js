
const fs = require('fs/promises');
const through = require('through2');
const parseOSM = require('./parser');

const osm = parseOSM();
let index = {};


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

const findAddressById = (index, type, id) => {

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

    console.log(collection.addr);

}

(async () => {

    const file1 = '/home/spirit/osrm/pbf/belarus-latest.osm.pbf';
    const file2 = '/home/spirit/osrm/pbf/_test.pbf';
    const indexFile = '/home/spirit/osrm/pbf/bel.index';

    let ind = await loadIndex(indexFile);
    findAddressById(ind, 'node', 123);
    return 1;

    // const data = await createIndex(file1, indexFile);
    // console.log('ok');
    // return 1;

    const fd = await fs.open(file1, 'r');

    // 171
    // 3048
    // 4087

    readData(fd, 171, (data) => {
        console.log('data 1', data.items.length);
    });

})()

