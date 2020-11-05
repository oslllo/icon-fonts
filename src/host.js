"use strict";

const Github = require("github-api");

const hosts = {
    github: {
        url: "https://github.com",
        archiver: "zipball",
        api: new Github(),
    },
};

const Host = function(name) {
    return hosts[name];
};

Host.prototype = {};

module.exports = Host;
