
const Knife = require('../lib/Knife');

const fileDir = '/Users/spirit/workspace/osm';

(async () => {

    const file1 = `${fileDir}/belarus.osm.pbf`;

    const knife = new Knife();
    await knife.setPBF(file1);
    await knife.createIndexFile();

    console.log('buildAddressIndex ok');

})().catch(err => {
    console.error(err);
})

