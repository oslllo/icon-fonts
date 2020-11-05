#!/usr/bin/env node

"use strict";

const Font = require("../");
const log = require("./log");
const fs = require("fs-extra");
const path2 = require("./path2");
const is = require("oslllo-validator");

// eslint-disable-next-line no-magic-numbers
var argv = require("yargs")(process.argv.slice(2))
    .scriptName("oslllo-icon-fonts")
    .usage("Usage: font <command> [options]")
    .option("purge", {
        alias: "p",
        default: false,
        type: "boolean",
        demandOption: false,
        describe: "empty assets font directory",
    })
    .option("update-all", {
        alias: "a",
        default: false,
        type: "boolean",
        demandOption: false,
        describe: "update all font libraries.",
    })
    .option("update", {
        alias: "u",
        type: "string",
        demandOption: false,
        describe: "update specific font library.",
    })
    .option("force-generate", {
        alias: "g",
        default: false,
        type: "boolean",
        demandOption: false,
        describe: "force generate library fonts.",
    })
    .help().argv;

var libraries = new Font("libraries");

/**
 * @description - Update font library
 * @param {*} library - Font library name
 */
async function update(library) {
    var instance = new Font(library);
    await instance.init();
    await instance.update().download();
    await instance.generate(argv.forceGenerate);
}

(async () => {
    if (argv.purge) {
        log.danger("warning: purging asset fonts.");
        fs.emptyDirSync(path2.assets.font);
    }
    if (argv.updateAll) {
        log.info("info: updating all fonts.");
        for (var i = 0; i < libraries.length; i++) {
            await update(libraries[i].name);
        }
    } else if (argv.update) {
        var name = argv.update;
        var library = libraries.filter(function(l) {
            return l.name == name;
        });
        if (is.false(library.length)) {
            throw new Error(
                log.danger(`error: no font library was found with name ${name}`)
            );
        }
        await update(library[0].name);
    }
})();
