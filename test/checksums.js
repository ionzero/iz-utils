var fs = require('fs');
var crypto = require('crypto');

function hash_file(algorithm, filename) {
    var data = fs.readFileSync(filename);
    return this.hash_data(algorithm, data);


}

function hash_data(algorithm, data) {
    var hasher = crypto.createHash(algorithm);
    hasher.update(data);
    return hasher.digest('hex');
}

module.exports = {
    hash_file: hash_file,
    hash_data: hash_data
};

