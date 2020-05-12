const Icons = require("../../");

async function run() {
    var icons = new Icons();
    await icons.update();
    await icons.transfer();
    await icons.generate();
    console.log("Run completed")
}

run();