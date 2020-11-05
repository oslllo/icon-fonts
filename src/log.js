"use strict";

const colors = require("colors");

/*eslint-disable no-console*/

const log = {
    title: function (text) {
        console.log(colors.bgWhite(colors.black(text)));
    },
    success: function(text) {
        console.log(colors.brightGreen(text));
    },
    warning: function(text) {
        console.log(colors.brightYellow(text));
    },
    danger: function(text) {
        console.log(colors.brightRed(text));
    },
    info: function(text) {
        console.log(colors.brightBlue(text));
    },
};

module.exports = log;
