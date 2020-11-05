"use strict";

const log = require("./log");
const path = require("path");
const fs = require("fs-extra");
const Host = require("./host");
const path2 = require("./path2");
const Manifest = require("./manifest");
const is = require("oslllo-validator");
const Repository = require("./repository");
const SVGFixer = require("oslllo-svg-fixer");
const { spawnSync } = require("child_process");

const libraries = [
    {
        name: "feather",
        host: "github",
        repository: {
            owner: "feathericons",
            name: "feather",
        },
        optimize: true,
        branch: "master",
        prefix: "fe",
        icons: {
            path: "icons",
        },
    },
    {
        name: "bootstrap-icons",
        host: "github",
        repository: {
            owner: "twbs",
            name: "icons",
        },
        optimize: true,
        branch: "master",
        prefix: "bi",
        icons: {
            path: "icons",
        },
    },
    {
        name: "simple-icons",
        host: "github",
        repository: {
            owner: "simple-icons",
            name: "simple-icons",
        },
        optimize: true,
        branch: "master",
        prefix: "si",
        icons: {
            path: "icons",
        },
    },
    {
        name: "ionicons",
        host: "github",
        repository: {
            owner: "ionic-team",
            name: "ionicons",
        },
        optimize: true,
        branch: "master",
        prefix: "ion",
        icons: {
            path: "src/svg",
        },
    },
];

const Font = function(name, data = libraries) {
    var paths = [path2.temp.index, path2.temp.repositories];
    paths.forEach(function(directory) {
        var exists = fs.existsSync(directory);
        if (exists == false) {
            fs.mkdirsSync(directory);
        }
    });
    if (name == "libraries") {
        return data;
    }
    var font = data.filter(function(f) {
        return f.name === name;
    });
    if (font.length == false) {
        throw new TypeError(log.danger(`error: no font with name ${name} was found`));
    }
    font = font[0];
    var storage = path.join(path2.assets.font, name);
    font.host = new Host(font.host);
    font.paths = {
        manifest: path.join(storage, "manifest.json"),
        font: path.join(storage, "font"),
        svgs: path.join(storage, "svgs"),
    };
    Object.assign(this, font);

    return this;
};

Font.prototype = {
    init: async function() {
        log.title(`\n${this.name}`.toUpperCase());
        this.repo = new Repository(this);
        await this.repo.commits().fetch(null, true);
        this.manifest = new Manifest(this);
    },
    update: function() {
        var self = this;

        return {
            check: async function() {
                log.info(`info: checking for ${self.name} updates.`);
                if (self.manifest.exists == false) {
                    throw new Error(
                        log.danger(
                            `error: ${self.name} does not have a manifest.json setup.`
                        )
                    );
                }
                await self.repo.commits().fetch(null, true);
                var current = self.manifest.commits().latest();
                var latest = self.repo.commits().latest();
                var outdated = current.sha != latest.sha;
                var message = `\n    | Current Commit => ${current.sha} |\n    | Latest Commit => ${latest.sha} |`;
                if (outdated) {
                    log.warning(`warning: ${self.name} is outdated. ${message}`);
                    self.manifest.set().outdated(true);
                } else {
                    log.success(`success: check completed.\n    | ${self.name} is up to date | ${message}`);
                    self.manifest.set().outdated(false);
                }

                return { outdated };
            },
            download: async function(force = { download: false, retrace: false }) {
                var isNew = self.manifest.new;
                var source = self.repo.svgs.path;
                var destination = self.paths.svgs;
                var { outdated } = await self.update().check();
                if (outdated || force.download || isNew) {
                    if (isNew) {
                        log.info(`info: fetching files for new font ${self.name}`);
                    }
                    if (force.download) {
                        log.warning(`warning: force updating ${self.name}`);
                    }
                    await self.repo.download();
                    if (self.optimize || force.retrace) {
                        await self.retrace(source, destination);
                    } else {
                        fs.copySync(source, destination);
                    }
                    var current = self.manifest.commits().latest();
                    var latest = self.repo.commits().latest();
                    log.success(
                        `success: updated ${self.name} from ${current.sha} => ${latest.sha}`
                    );
                } else {
                    log.info(
                        `info: ${self.name} is up to date, skipping repository download.`
                    );
                }
            },
        };
    },
    retrace: async function(source, destination) {
        log.info(`info: retracing svgs for ${this.name}`);
        var options = {
            showProgressBar: true,
        };
        await SVGFixer(source, destination, options).fix();
        log.success(`success: retrace complete for ${this.name}`);
    },
    generate: function(force = false) {
        return new Promise((resolve) => {
            if (is.false(this.manifest.outdated) && is.false(force)) {
                log.info(`info: skipping ${this.name} font generation because it's up to date.`);
                resolve();

                return;
            }
            if (force) {
                log.warning(`warning: force generating font for ${this.name}.`);
            }
            log.info(`info: generating font for ${this.name}`);
            var source = this.paths.svgs;
            var destination = this.paths.font;
            try {
                var { error, stderr, output, stdout } = spawnSync("npm", [
                    "run",
                    "webfont",
                    "--",
                    `${source}`,
                    "--template",
                    "css",
                    "--dest",
                    `${destination}`,
                    "--font-height",
                    "1000",
                    "--normalize",
                    "true",
                    "--font-name",
                    `${this.name}`,
                    "--template-class-name",
                    `${this.prefix}`,
                    "--verbose",
                ]);
            } catch (e) {
                throw new Error(log.danger(`MAJOR ERROR: ${e.message}`));
            }

            if (typeof error !== "undefined" && error) {
                throw new Error(log.danger(`error: ${error}`));
            }

            if (typeof stderr !== "undefined" && typeof stderr == "string") {
                throw new Error(log.danger(`stderr: ${stderr}`));
            }

            if (typeof output !== "undefined") {
                if (output.includes("Error:") || output.includes("svg2ttf")) {
                    throw new Error(log.warning(`output: ${output}`));
                }
            }

            if (typeof stdout !== "undefined" && typeof stdout == "string") {
                log.info(`stdout: ${stdout}`);
            }
            log.success(`success: font generated for ${this.name}`);
            resolve();
        });
    },
};

module.exports = Font;
