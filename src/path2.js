"use strict";

const path = require("path");

var temp = new Object(null);

temp.index = path.resolve("temp");
temp.repositories = path.join(temp.index, "repositories");

var assets = new Object(null);

assets.index = path.resolve("src/assets");
assets.font = path.join(assets.index, "font");

var dist = new Object(null);

dist.index = path.resolve("dist");

module.exports = {
    dist,
    temp,
    assets
};
