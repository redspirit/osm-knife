
const fs = require('fs');
const Knife = require('./lib/Knife');
const KTree = require('./lib/KTree');
const KPoly = require('./lib/KPoly');
const tagsFilter = require('./tagsFilter');
const utils = require('./lib/utils');
// const clipboardy = require('clipboardy');



(async () => {

    const file1 = '/Users/spirit/workspace/osm/belarus-latest.osm.pbf';
    const tagsFile = '/Users/spirit/workspace/osm/belarus-latest.tags.json';
    // const file2 = 'D:/osrm/pbf/_test.pbf';
    // const file2 = 'D:/osrm/pbf/_test.pbf';

    const knife = new Knife();
    await knife.setPBF(file1);
    // await knife.createIndexFile();

    // await knife.applyFilter(tagsFilter, tagsFile);
    // await knife.statFilters(tagsFile);
    // console.log('ok');
    // return;

    await knife.loadIndex();

    // const rels = await knife.getRelation(59195, 1);
    // fs.writeFileSync('/Users/spirit/workspace/osm/region_raw.json', JSON.stringify(rels));
    let text = fs.readFileSync('/Users/spirit/workspace/osm/region_raw.json').toString();
    let rels = JSON.parse(text);

    const poly = new KPoly();
    let geoj = poly.fromRelation(rels);


    // clipboardy.writeSync(JSON.stringify(geoj));

    // console.log(geoj);

    // let geos = knife.relationToGeoJson(rels);
    const tokens1 = knife.getS2Tokens(geoj);
    // return console.log(JSON.stringify(geos));

    // let str = [...tokens1].join(',');
    // utils.clipboard(str);
    // console.log(str);
    return;

    await knife.readEntityIndex(tagsFile, 'regions', 'relation', async (relId, next) => {

        const rel = await knife.getRelation(relId, 1);
        const poly = new KPoly();
        let geo = poly.fromRelation(rel);

        // 59752

        console.log(rel);
        // console.log(relId);

    });

    return;

    // const wayId = 25263694;
    const wayId = 560900717;
    const relId = 4677257;
    const rel = await knife.getRelation(relId, 1);
    // const way = await knife.getWay(wayId, 1);

    // console.log('Rel:', JSON.stringify(rel));
    // console.log('Rel:', rel);
    // console.log('Way:', way);
    // console.log('Way:', JSON.stringify(knife.relationToGeoJson(rel)));

    let geo = knife.relationToGeoJson(rel);
    // console.log('points:', JSON.stringify(geo));

    const tokens = knife.getS2Tokens(geo);
    console.log(tokens.join(','));

    const tree = new KTree();

    tree.insertManyCells(tokens, {rid: relId});
    // tree.showData();

    let res = tree.search('46d6d5d766cc');
    console.log(res.props);


})().catch(err => {
    console.error(err);
})

