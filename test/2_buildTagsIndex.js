
const Knife = require('../lib/Knife');
const tagsFilter = require('../tagsFilter');

const fileDir = '/Users/spirit/workspace/osm';

(async () => {

    const pbfFile = `${fileDir}/belarus.osm.pbf`;
    const tagsFile = `${fileDir}/belarus.tags.json`;

    const knife = new Knife();
    await knife.setPBF(pbfFile);

    await knife.applyFilter(tagsFilter, tagsFile);
    await knife.statFilters(tagsFile);
    console.log('buildTagsIndex ok');

})().catch(err => {
    console.error(err);
})

