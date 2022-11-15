const utils = require("./utils");
const turfHelpers = require("@turf/helpers");

class KPoly {

    constructor() {

    }

    fromWay(way) {
        if(way.type !== 'way') return null;
        const points = way.refs.map(ref => {
            return [utils.roundCoord(ref.lon), utils.roundCoord(ref.lat)];
        });
        return turfHelpers.lineString(points).geometry;
    }

    fromRelation(relation) {

        let pointsLine = [];
        let geometryList = [];

        relation.members.forEach(member => {
            if(!member) return;
            if(member.role !== 'outer') return;
            let geo = this.fromWay(member);
            if(!geo) return;
            let coords = geo.coordinates;
            pointsLine = this.joinCoords(pointsLine, coords);
            let isClosed = utils.isClosedGeom(pointsLine);
            if(isClosed) {
                geometryList.push(turfHelpers.polygon([pointsLine]).geometry);
                pointsLine = [];
            }
        });

        // закомментировал, так как вставка "дырок" в геометрию
        // не оправдана для алгоритма S2
        // let oldOuter = null;
        // let geometryList = [];
        // features.forEach(feature => {
        //     let role = feature.properties.role;
        //     console.log(role);
        //     if(role === 'outer') {
        //         oldOuter = feature.geometry;
        //         geometryList.push(oldOuter);
        //     } else if(role === 'inner') {
        //         oldOuter.coordinates.push(feature.geometry.coordinates[0]);
        //     }
        // });

        if(geometryList.length === 0) return null;
        if(geometryList.length === 1) {
            return geometryList[0];
        } else {
            return {
                type: 'MultiPolygon',
                coordinates: geometryList.map(item => item.coordinates)
            }
        }

    }

    joinCoords(subset, line) {

        if(subset.length === 0) return line;

        let startAll = subset[0].join(',');
        let endAll = subset[subset.length - 1].join(',');
        let startLine = line[0].join(',');
        let endLine = line[line.length - 1].join(',');

        if(endAll === startLine) {
            line.shift();
            return subset.concat(line);
        } else if(endAll === endLine) {
            line.pop();
            return subset.concat(line.reverse());
        } else if(startAll === startLine) {
            subset.shift();
            return line.reverse().concat(subset);
        } else if(startAll === endLine) {
            subset.shift();
            return line.concat(subset);
        } else {
            return null;
        }
    }


}

module.exports = KPoly;