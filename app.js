
const Knife = require('./lib/Knife');
const KTree = require('./lib/KTree');
const tagsFilter = require('./tagsFilter');

(async () => {

    const file1 = '/Users/spirit/workspace/osm/belarus-latest.osm.pbf';
    const tagsFile = '/Users/spirit/workspace/osm/belarus-latest.tags.json';
    // const file2 = 'D:/osrm/pbf/_test.pbf';
    // const file2 = 'D:/osrm/pbf/_test.pbf';

    const knife = new Knife();
    await knife.setPBF(file1);
    // await knife.createIndexFile();

    // await knife.applyFilter(tagsFilter, tagsFile);
    // console.log('ok');
    // return;

    await knife.loadIndex();

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

    const tokens = knife.getS2CellsGeo(geo);
    console.log(tokens.join(','));

    const tree = new KTree();

    tree.insertManyCells(tokens, {rid: relId});
    // tree.showData();

    let res = tree.search('46d6d5d766cc');
    console.log(res.props);


})().catch(err => {
    console.error(err);
})

