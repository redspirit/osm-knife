const fs = require('fs/promises');
const _ = require("underscore");
const through = require("through2");
const async = require("async");
const parseOSM = require("../parser");
const utils = require("./utils");

class Knife {

    constructor() {
        this.indexData = {};
        this.fd = null;
    }

    async setPBF(pbfFile) {
        this.pbfFile = pbfFile;
        this.indexFile = pbfFile + '.index';
        this.fd = await fs.open(this.pbfFile, 'r');
        await this.loadIndex();
    }

    createIndexFile () {

        const nodes = {addr: [], idx: []};
        const ways = {addr: [], idx: []};
        const relations = {addr: [], idx: []};
        let progress = 0;
        let progressOld = 0;

        return new Promise(async (resolve, reject) => {

            if(!this.fd) return reject(new Error('PBF file not opened'));
            const stat = await this.fd.stat();

            this.fd.createReadStream()
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
                    this.indexData = {nodes, ways, relations};
                    await fs.writeFile(this.indexFile, JSON.stringify(this.indexData));
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

            if(!this.fd) reject(new Error('PBF file not opened'));

            const stream = this.fd.createReadStream({start})
                .pipe(new parseOSM.BlobParser())
                .pipe(new parseOSM.BlobDecompressor())
                .pipe(new parseOSM.PrimitivesParser())
                .pipe(through.obj((data, enc, next) => {
                    resolve(data);
                    stream.destroy();
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

        return itemId < 0 ? null : _.omit(block.items[itemId], ['info']);

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

        const relation = await this.findById(id, 'relation');

        if(!deep) return relation;

        if(!relation) return null;
        relation.members = await async.mapSeries(relation.members, async (member) => {
            if(member.type === 'node') {
                const node = await this.getNode(member.id)
                node.role = member.role;
                return node;
            } else if(member.type === 'way') {
                const way = await this.getWay(member.id, deep)
                way.role = member.role;
                return way;
            } else {
                return null;
            }
        });
        return relation;
    }

}

module.exports = Knife;