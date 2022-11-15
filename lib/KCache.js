class KCache {

    constructor(limit) {
        this.items = {};
        this.limit = limit;
    }

    setItem (key, data) {
        this.items[key] = data;
        let keys = Object.keys(this.items);
        // console.log('-',keys.length);
        if(keys.length > this.limit) {
            delete this.items[keys[0]];
        }
    }

    getItem (key) {
        return this.items[key];
    }

    getSize() {
        return Object.keys(this.items).length;
    }

    clear() {
        this.items = {};
    }

}

module.exports = KCache;