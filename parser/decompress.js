const zlib = require('zlib');
const Transform = require('stream').Transform;

class BlobDecompressor extends Transform {

    constructor() {
        super({ objectMode: true, highWaterMark: 1 });
    }

    _transform(chunk, enc, cb) {
        // console.log("decompress", chunk.zlib_data.length);
        zlib.inflate(chunk.zlib_data, function (err, data) {
            // console.log("decompressed", chunk.zlib_data.length, "into", data.length);
            if (data) {
                chunk.data = data;
                delete chunk.zlib_data;
                this.push(chunk);
            }
            cb(err);
        }.bind(this));
    }

}

module.exports = BlobDecompressor;