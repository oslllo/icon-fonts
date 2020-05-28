const path = require("path");
const fs = require("fs-extra");
const _ = require("lodash")

function Library() {}

Library.prototype = {
    all: function () {
        return JSON.parse(fs.readFileSync(path.resolve("src/assets/libraries.json")));
    }
}

module.exports = Library;