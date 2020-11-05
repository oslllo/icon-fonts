"use strict";

const path = require("path");
const fs = require("fs-extra");
const log = require("../src/log");
const path2 = require("../src/path2");

log.info("info: building package.");
const dist = path2.dist.index;
fs.emptyDirSync(dist);
fs.copySync(path2.assets.font, dist);
fs.readdirSync(dist).forEach((s) => {
    var source = path.join(dist, s);
    fs.readdirSync(source)
        .filter((f) => (/[.]json$/u).test(f))
        .forEach((f) => {
            fs.removeSync(path.join(source, f));
        });
});
log.success("success: building complete.");
