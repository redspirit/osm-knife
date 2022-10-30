
const Knife = require('./lib/Knife');
const tagsFilter = require('./tagsFilter');

(async () => {

    const file1 = '/Users/spirit/workspace/osm/belarus-latest.osm.pbf';
    const tagsFile = '/Users/spirit/workspace/osm/belarus-latest.tags.json';
    // const file2 = 'D:/osrm/pbf/_test.pbf';
    // const file2 = 'D:/osrm/pbf/_test.pbf';

    const knife = new Knife();
    await knife.setPBF(file1);
    // await knife.createIndexFile();


    await knife.applyFilter(tagsFilter, tagsFile);
    console.log('ok');
    return;

    await knife.loadIndex();

    // const wayId = 25263694;
    const wayId = 560900717;
    const relId = 1749244;
    const rel = await knife.getRelation(relId, 1);
    // const way = await knife.getWay(wayId, 1);

    // console.log('Rel:', JSON.stringify(rel));
    // console.log('Rel:', rel);
    // console.log('Way:', way);
    // console.log('Way:', JSON.stringify(knife.relationToGeoJson(rel)));

    let geo = knife.relationToGeoJson(rel).features[0].geometry;

    console.log('points:', geo.coordinates[0].length);


    knife.getS2CellsGeo(geo);


})().catch(err => {
    console.error(err);
})

