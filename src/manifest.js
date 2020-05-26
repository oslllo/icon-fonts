function Manifest(library) {
    if (library) {
        this.library = library;
        this.frozen = {
            state: false
        };
        this.has = {
            tags: false
        }
        this.is = {
            new: true,
            outdated: true
        };
        this.logs = [];
    }
}

Manifest.prototype = {
    save: function () {
        fs.writeFileSync(pathToManifest, JSON.stringify(this, null, 2));
    },
    log: function (log) {
        if (typeof log !== "object") {
            throw new TypeError(`log data should be an object, ${typeof log} was given.`)
        }
        this.logs.unshift(log);
    }
};

module.exports = Manifest;
