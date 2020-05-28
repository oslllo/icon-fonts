#!/usr/bin/env node
const Font = require("../");
const _ = require("lodash");
const colors = require("colors");
const Library = require("./library");
const inquirer = require('inquirer');

var library = new Library;
var libraries = library.all();
var argv = require('yargs')
    .scriptName("")
    .usage('Usage: font <command> [options]')
    .command('update', 'Update font libraries.', function (yargs) {
        return yargs.option({
            'a': {
                alias: 'all',
                demandOption: false,
                describe: 'updates all font libraries to the latest versions.',
                type: 'boolean',
            },
            'f': {
                alias: 'font',
                demandOption: false,
                describe: 'update font library with this name.',
                type: 'string',
                default: "undefined"
            }
        })
    }, (argv) => {
        update(argv);
    })
    .help('h')
    .argv;

async function update(args) {
    switch (true) {
        case args.a && (typeof args.a !== "undefined"):
            console.log(`${colors.brightBlue(`Updating all font libraries.`)}`);
            var _libraries = _libraries.data;
            for(var i = 0; i < _libraries.length; i++) {
                var _library = _libraries[i];
                await process(_library);
            }
            break;
        case args.f !== "undefined":
            var _library = _.find(libraries.data, (l) => {
                return l.name === args.f;
            });
            if (!_library || (typeof _library === "undefined")) {
                throw new TypeError(`Font library with name ${args.f} was not found.`);
            }
            await process(_library);
            break;
    }
}

async function process(lib, options) {
    var _font = new Font(lib);
    if (options) {
        if (typeof options !== "object" || Array.isArray(options)) {
            throw new TypeError(`options argument should be of type object ${typeof options} given.`);
        }
        // if (options.version) {}
    }
    await _font.update();
    await _font.optimize();
    await _font.generate();
}
