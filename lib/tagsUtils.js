const polygonFeatures = {};
require("osm-polygon-features").forEach((tags) => {
    if (tags.polygon === "all")
        polygonFeatures[tags.key] = true;
    else {
        let list = (tags.polygon === "whitelist") ? "included_values" : "excluded_values",
            tagValuesObj = {};
        tags.values.forEach((value) => { tagValuesObj[value] = true; });
        polygonFeatures[tags.key] = {};
        polygonFeatures[tags.key][list] = tagValuesObj;
    }
});

const isPolygonFeature = (tags) => {
    // explicitely tagged non-areas
    if ( tags['area'] === 'no' ) return false;
    // assuming that a typical OSM way has in average less tags than
    // the polygonFeatures list, this way around should be faster
    for ( let key in tags ) {
        let val = tags[key];
        let pfk = polygonFeatures[key];
        // continue with next if tag is unknown or not "categorizing"
        if ( typeof pfk === 'undefined' )
            continue;
        // continue with next if tag is explicitely un-set ("building=no")
        if ( val === 'no' )
            continue;
        // check polygon features for: general acceptance, included or excluded values
        if ( pfk === true )
            return true;
        if ( pfk.included_values && pfk.included_values[val] === true )
            return true;
        if ( pfk.excluded_values && pfk.excluded_values[val] !== true )
            return true;
    }
    // if no tags matched, this ain't no area.
    return false;
}

module.exports = {
    isPolygonFeature
}