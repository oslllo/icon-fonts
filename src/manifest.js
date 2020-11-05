"use strict";

const log = require("./log");
const path = require("path");
const fs = require("fs-extra");
const path2 = require("./path2");
const is = require("oslllo-validator");

const Manifest = function(font) {
    this.font = font;
    this.repo = font.repo;
    this.new = true;
    this.hasTags = false;
    this.outdated = true;
    this.data = new Object(null);
    this.path = path.join(path.join(path2.assets.font, font.name), "manifest.json");
    this.exists = fs.existsSync(this.path);
    if (this.exists) {
        this.new = false;
        this.load();
    } else {
        this.setup();
    }
};

Manifest.prototype = {
    set: function() {
        var self = this;

        return {
            outdated: function(state) {
                self.outdated = state;
            },
        };
    },
    save: function() {
        /*eslint-disable-next-line no-magic-numbers */
        fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
    },
    load: function() {
        this.data = JSON.parse(fs.readFileSync(this.path));
        this.exists = true;
    },
    setup: function() {
        log.info(`info: found new font library ${this.font.name}, setting up files.`);
        var paths = [this.font.paths.font, this.font.paths.svgs];
        paths.forEach(function(directory) {
            var exists = fs.existsSync(directory);
            if (is.false(exists)) {
                fs.mkdirsSync(directory);
            }
        });
        var commits = this.repo.commits().all();
        this.commits(commits).set();
        this.save();
        this.load();
        log.success(`success: setup complete for ${this.font.name}`);
    },
    commits: function(commits) {
        var self = this;

        return {
            set: function() {
                self.data = { commits: commits };
            },
            add: function() {
                self.data.commits.unshift(commits);
            },
            latest: function() {
                return self.data.commits[0];
            },
            previous: function() {
                /*eslint-disable-next-line no-magic-numbers */
                return self.data.commits[1];
            },
        };
    },
};

module.exports = Manifest;
