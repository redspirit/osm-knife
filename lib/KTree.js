const _ = require("underscore");
const s2 = require("@radarlabs/s2");
const util = require('util');

function expand(token, callback) {
    let cell = s2.CellId.fromToken(token);
    let lvl = cell.level();
    for(let i = 1; i < lvl; i++) {
        callback(i, cell.parent(i).token());
    }
    callback(lvl, token);
}

function expandArr(token) {
    let cell = s2.CellId.fromToken(token);
    let lvl = cell.level();
    let arr = _.range(1, lvl).map(i => {
        return cell.parent(i).token();
    });
    arr.push(token);
    return arr;
}

class KTree {

    constructor() {
        this.data = {
            children: []
        }
    }

    insertTo(_parent, cellId){

        let parent = _parent ? _parent : this.data;
        let exists = _.findWhere(parent.children, {id: cellId});
        if(exists) {
            return exists;
        }

        let node = {
            id: cellId,
            children: []
        };
        parent.children.push(node);
        return node;
    }

    setProps(node, props) {
        if(node.props) {
            node.props.push(props);
        } else {
            node.props = [props]
        }
    }

    insertCell(token, props) {
        let node = null;
        expand(token, (level, token) => {
            node = this.insertTo(node, token);
        });
        this.setProps(node, props);
    }

    insertManyCells(tokens, props) {
        tokens.forEach(token => {
            this.insertCell(token, props);
        });
    }

    search(token) {

        let node = this.data;
        let oldNode;

        for (let id of expandArr(token)) {

            // console.log(id);
            node = _.findWhere(node.children, {id});
            if(node) {
                if(id === token) {
                    return node;
                }
            } else {
                // console.log('check id', id);

                let cell = s2.CellId.fromToken(id);

                let contains = cell.contains(s2.CellId.fromToken(token))
                if(contains) {
                    return oldNode;
                }

                break;
            }
            oldNode = node;
        }

        return null;

    }

    showData() {
        console.log(util.inspect(this.data, false, null, true));
    }


}

module.exports = KTree;