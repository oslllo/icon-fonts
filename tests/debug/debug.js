const Font = require("../../");

var libraries = [
    {
        name: "feather",
        host: "github",
        repo: {
            owner: "feathericons",
            name: "feather",
        },
        branch: "master",
        prefix: "fe",
        images: {
            path: "icons",
            format: "svg",
        },
    },
    {
        name: "bootstrap-icons",
        host: "github",
        repo: {
            owner: "twbs",
            name: "icons",
        },
        branch: "master",
        prefix: "fe",
        images: {
            path: "icons",
            format: "svg",
        },
    },
    // {
    // 	name: "simple-icons",
    // 	host: this.host.github,
    // 	repo: "/simple-icons/simple-icons",
    // 	branch: "/master",
    // 	prefix: "si",
    // 	images: {
    // 		path: "/icons",
    // 		format: "svg",
    // 	},
    // },
];

async function run() {
    for(var i = 0; i < libraries.length; i++) {
        var library = libraries[i];
        var font = new Font(library);
        await font.update();
        await font.optimize();
        await font.generate();
    }
    console.log("Run completed");
}

run();