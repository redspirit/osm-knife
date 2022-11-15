const fs = require('fs/promises');
const _ = require("underscore");
const turfHelpers = require("@turf/helpers");
const turfMeta = require("@turf/meta");
const turfPolygonize = require("@turf/polygonize").default;
const s2 = require('@radarlabs/s2');
const through = require("through2");
const async = require("async");
const parseOSM = require("../parser");
const utils = require("./utils");
const KCache = require("./KCache");

const blockCache = new KCache(500);

let i = 0;
let j = 0;
let rand = '';

class Knife {

    constructor() {
        this.indexData = {};
        this.fd = null;
    }

    async setPBF(pbfFile) {
        this.pbfFile = pbfFile;
        this.indexFile = pbfFile + '.index';
        await this.loadIndex();
    }

    // build entity index
    applyFilter(tagsFilter, saveFile) {

        let progress = 0;
        let progressOld = 0;

        return new Promise(async (resolve, reject) => {
            const fd = await fs.open(this.pbfFile, 'r');
            const stat = await fd.stat();
            const types = Object.keys(tagsFilter);
            let result = {};

            fd.createReadStream()
                .pipe(new parseOSM.BlobParser())
                .pipe(new parseOSM.BlobDecompressor())
                .pipe(new parseOSM.PrimitivesParser())
                .pipe(through.obj((data, enc, next) => {

                    data.items.forEach(item => {
                        if(_.isEmpty(item.tags)) return false;

                        types.forEach(type => {
                            let isFilter = tagsFilter[type].length > 0;
                            let isMatch = isFilter && _.some(tagsFilter[type], tag => {
                                return _.every(Object.keys(tag), key => {
                                    if(tag[key] === '*' && item.tags[key]) return true;
                                    return tag[key] === item.tags[key];
                                });
                            });
                            if(isMatch) {
                                let cat = item.type;
                                if(result[type]) {
                                    if(result[type][cat]) {
                                        result[type][cat].push(item.id);
                                    } else {
                                        result[type][cat] = [item.id];
                                    }
                                } else {
                                    result[type] = {[cat]: [item.id]};
                                }
                            }
                        });

                    });

                    progress = Math.round(data.offset / stat.size * 100);
                    if(progress !== progressOld) {
                        console.log(`Process: ${progress}%`);
                        progressOld = progress;
                    }

                    next();
                }))
                .on('finish', async () => {
                    // this.indexData = {nodes, ways, relations};
                    await fs.writeFile(saveFile, JSON.stringify(result));
                    await fd.close();
                    resolve(true);
                });

        });

    }

    async statFilters(indexFile) {

        const file = await fs.readFile(indexFile);
        const json = JSON.parse(file.toString());

        for(let key in json) {
            const entity = json[key];
            console.log(`Entity "${key}" has:`);
            for(let key2 in entity) {
                console.log(`> ${key2} in ${entity[key2].length} items`);
            }
        }

    }

    async readEntityIndex(indexFile, entity, type, onItem) {
        const file = await fs.readFile(indexFile);
        const json = JSON.parse(file.toString());
        return async.eachSeries(json[entity][type], onItem);
    }

    // build head index
    createIndexFile () {

        const nodes = {addr: [], idx: []};
        const ways = {addr: [], idx: []};
        const relations = {addr: [], idx: []};
        let progress = 0;
        let progressOld = 0;

        return new Promise(async (resolve, reject) => {

            const fd = await fs.open(this.pbfFile, 'r');
            const stat = await fd.stat();

            fd.createReadStream()
                .pipe(new parseOSM.BlobParser())
                .pipe(new parseOSM.BlobDecompressor())
                .pipe(new parseOSM.PrimitivesParser())
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
                    this.indexData = {nodes, ways, relations};
                    await fs.writeFile(this.indexFile, JSON.stringify(this.indexData));
                    await fd.close();
                    resolve(true);
                });
        })

    }

    async loadIndex () {
        const exists = await fs
            .access(this.indexFile, fs.constants.F_OK)
            .then(res => true, err => false);
        if(!exists) {
            throw new Error(`Index file ${this.indexFile} not found. Create it with ".createIndexFile()"`);
        }
        const buf = await fs.readFile(this.indexFile);
        this.indexData = JSON.parse(buf.toString());
        return true;
    }

    findAddressById (targetId, type) {

        if(!this.indexData.nodes) throw new Error('Index data not loaded!');

        let collection = [];
        if(type === 'node') {
            collection = this.indexData.nodes;
        } else if(type === 'way') {
            collection = this.indexData.ways;
        } else if(type === 'relation') {
            collection = this.indexData.relations;
        } else {
            return null;
        }

        let ind = utils.BS(collection.addr, targetId, (id, k) => {
            let startEnd = collection.idx[k]
            // console.log(id, k, startEnd);
            if(id > startEnd[1]) return 1;
            if(id < startEnd[0]) return -1;
            if(id >= startEnd[0] && id <= startEnd[1]) return 0;
        })
        return ind >= 0 ? collection.addr[ind] : null;

    }

    readBlock (start) {
        return new Promise(async (resolve, reject) => {

            rand = Math.random().toString(36).substr(2, 5);

            const cachedBlock = blockCache.getItem(start);
            if(cachedBlock) {
                return resolve(cachedBlock);
            }

            const fd = await fs.open(this.pbfFile, 'r');
            const stream = fd.createReadStream({start})
                .pipe(new parseOSM.BlobParser())
                .pipe(new parseOSM.BlobDecompressor())
                .pipe(new parseOSM.PrimitivesParser())
                .pipe(through.obj((data, enc, next) => {
                    stream.destroy();
                    fd.close();
                    blockCache.setItem(start, data);
                    resolve(data);
                }));
        });
    }

    async findById (id, type) {

        const addr = this.findAddressById(id, type);
        if(addr < 0) return null;

        const block = await this.readBlock(addr);
        const itemId = utils.BS(block.items, id, (_id, k) => {
            return Math.sign(_id - block.items[k].id);
        });

        if(itemId < 0) return null;

        return _.omit(block.items[itemId], ['info']);
    }

    getNode (id) {
        return this.findById(id, 'node');
    }

    async getWay (id, deep = false) {
        const way = await this.findById(id, 'way');

        if(!deep) return way;

        if(!way) return null;
        way.refs = await async.mapSeries(way.refs, async (ref) => {
            return await this.getNode(ref);
        });
        return way;

    }

    async getRelation (id, deep = false) {

        blockCache.clear();

        let relation = await this.findById(id, 'relation');

        if(!deep) return relation;

        if(!relation) return null;

        try {
            relation.members = await async.mapSeries(relation.members, async (member) => {
                if(member.type === 'node') {
                    const node = await this.getNode(member.id);
                    if(!node) throw new Error('entity_incomplete');
                    node.role = member.role;
                    return node;
                } else if(member.type === 'way') {
                    const way = await this.getWay(member.id, deep);
                    if(!way) throw new Error('entity_incomplete');
                    way.role = member.role;
                    return way;
                } else {
                    return null;
                }
            });
        } catch (err) {
            relation = null;
        }
        return relation;
    }

    toGeoJson (obj) {

    }

    // polygon or multipolygon
    getS2Tokens(geometry) {

        const config = {
            min: 1,
            max: 19,
            max_cells: 15,
        }

        let tokens = []
        geometry.coordinates.forEach(polyCoords => {
            let coords = polyCoords[0];
            coords.pop();
            const s2LLs = coords.map(([lng, lat]) => (new s2.LatLng(lat, lng)));
            const covering = s2.RegionCoverer
                // .getCoveringTokens(s2LLs, config); // hex string
                // .getCoveringIds(s2LLs, config); // bigint
                .getCovering(s2LLs, config); // bigint
            tokens = tokens.concat(covering.cellIds().map(cell => {
                return {
                    level: cell.level(),
                    token: cell.token(),
                    cell
                }
            }));
        });

        tokens = tokens.sort((a,b) => a.level - b.level);

        if(geometry.coordinates.length > 1) {
            // filter



            let d = tokens[0].cell.contains(tokens[tokens.length-1].cell);

            console.log('>>', d)

        }


        // this.clearTokens(tokens);

        // todo надо еще отфильтровать лишние ячейки
        // маленькие могут входить в большие

        // console.log(tokens);

        // return new Set(tokens);
    }

    getS2CellPoint(lat, lng) {
        return new s2.CellId(new s2.LatLng(lat, lng));
    }

}

module.exports = Knife;