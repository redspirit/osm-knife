
const Knife = require('../lib/Knife');
const KPoly = require("../lib/KPoly");
const utils = require("../lib/utils");

const fileDir = '/Users/spirit/workspace/osm';
const cacheFile = `${fileDir}/relation.json`;

(async () => {

    const pbfFile = `${fileDir}/belarus.osm.pbf`;
    const tagsFile = `${fileDir}/belarus.tags.json`;

    const knife = new Knife();
    await knife.setPBF(pbfFile);
    await knife.loadIndex();

    // const rel = await knife.getRelation(59275, 1);
    // utils.saveToFile(cacheFile, rel);

    // const rel = utils.readFromFile(cacheFile);
    // const poly = new KPoly();
    // let geo = poly.fromRelation(rel);
    // console.log(geo);
    // utils.clipboard(geo);
    // return;

    await knife.readEntityIndex(tagsFile, 'regions', 'relation', async (relId) => {

        const rel = await knife.getRelation(relId, 1);
        if(!rel) return;
        const poly = new KPoly();
        let geo = poly.fromRelation(rel);
        // 59752
        console.log(rel.id, rel.tags.name, !!geo);
        // console.log(relId);

    });

    console.log('buildGeometry ok');

})().catch(err => {
    console.error(err);
})

