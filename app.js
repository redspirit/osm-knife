
const Knife = require('./lib/Knife');

(async () => {

    const file1 = '/Users/spirit/workspace/osm/belarus-latest.osm.pbf';
    // const file2 = 'D:/osrm/pbf/_test.pbf';
    // const file2 = 'D:/osrm/pbf/_test.pbf';

    const knife = new Knife();
    await knife.setPBF(file1);
    // await knife.createIndexFile();

    await knife.loadIndex();

    // const wayId = 25263694;
    const wayId = 560900717;
    const relId = 1749244;
    const rel = await knife.getRelation(relId, 1);
    // const way = await knife.getWay(wayId, 0);

    console.log('Rel:', JSON.stringify(rel));
    // console.log('Way:', way);

})().catch(err => {
    console.error(err);
})

