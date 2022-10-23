
const Knife = require('./lib/Knife');

(async () => {

    const file1 = '/Users/spirit/workspace/osm/belarus-latest.osm.pbf';
    // const file2 = 'D:/osrm/pbf/_test.pbf';
    // const file2 = 'D:/osrm/pbf/_test.pbf';

    const knife = new Knife();
    await knife.setPBF(file1);
    // await knife.createIndexFile();

    await knife.loadIndex();

    const wayId = 25263694;
    const relId = 1749244;
    const item = await knife.getRelation(relId, true);
    // const item = await knife.getWay(wayId, true);

    console.log('Found:', item);

})().catch(err => {
    console.error(err);
})

