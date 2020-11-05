"use strict";

const log = require("./log");
const path = require("path");
const path2 = require("./path2");
const is = require("oslllo-validator");
const dgr = require("download-git-repo");

const Repository = function(font) {
    var host = font.host;
    var owner = font.repository.owner;
    var name = font.repository.name;

    this.font = font;
    this.host = host;
    this.data = new Object(null);
    this.instance = this.host.api.getRepo(owner, name);
    this.svgs = {
        path: path.join(
            path.join(path2.temp.repositories, this.font.name),
            this.font.icons.path
        ),
    };
};

Repository.prototype = {
    tags: function(tags) {
        var self = this;

        return {
            set: function() {
                self.data.tags = tags;
            },
            exist: function() {
                return Boolean(self.data.tags.length);
            },
            latest: function() {
                return self.data.tags.length ? self.data.tags[0] : null;
            },
            fetch: async function(set = false) {
                var { data } = await self.instance.listTags();
                if (set) {
                    self.tags(data).set();
                }

                return data;
            },
        };
    },
    commits: function(commits) {
        var self = this;

        return {
            all: function () {
                return self.data.commits;
            },
            tag: function(tag) {
                return {
                    set: function() {
                        commits.tag = tag;
                        self.commits(commits).set();

                        return commits;
                    },
                };
            },
            set: function() {
                self.data.commits = commits;
            },
            fetch: async function(sha, set = false) {
                var fetched;
                if (sha) {
                    fetched = await self.instance.getCommit(sha);
                } else {
                    fetched = await self.instance.listCommits({
                        path: self.font.icons.path,
                    });
                }

                var { data } = fetched;

                data = is.array(data) ? data : [data];

                if (set) {
                    self.commits(data).set();
                }

                return data;
            },
            latest: function() {
                return self.data.commits[0];
            },
        };
    },
    download: function(tree = undefined) {
        return new Promise((resolve) => {
            var font = this.font;
            var branch = tree ? tree : font.branch;
            var source =
                "direct:" +
                font.host.url +
                "/" +
                font.repository.owner +
                "/" +
                font.repository.name +
                "/" +
                font.host.archiver +
                "/" +
                branch;
            var destination = path.join(path2.temp.repositories, font.name);
            log.info(`info: downloading ${font.name} repository`);
            var done = (err) => {
                if (err) {
                    log.danger(`error: downloading ${font.name} repository.`);
                    throw err;
                }
                log.success(`success: downloaded ${font.name} repository.`);
                resolve({ destination });
            };
            dgr(source, destination, {}, done);
        });
    },
};

module.exports = Repository;
