const fs = require("fs");
const dgr = require("download-git-repo");
const path = require("path");
const { spawnSync, exec } = require("child_process");
const svgfixer = require("oslllo-svg-fixer");

function Icons() {
    this.options = {

    },
	this.host = {
		github: {
			url: "https://github.com",
			archiver: "/zipball",
		},
    };
    this.path = {
        temp: (function() {
            var root = path.resolve("temp");
            var repos = path.join(root, "/repos");
            return { root, repos }
        })(),
        fonts: path.resolve("src/assets/fonts"),
        icons: path.resolve("src/assets/icons"),
    };
	this.library = [
		{
			name: "feather",
			host: this.host.github,
			repo: "/feathericons/feather",
			branch: "/master",
			prefix: "fe",
			images: {
				path: "/icons",
				format: "svg",
			},
        },
        {
			name: "simple-icons",
			host: this.host.github,
			repo: "/simple-icons/simple-icons",
			branch: "/master",
			prefix: "si",
			images: {
				path: "/icons",
				format: "svg",
			},
		},
    ];
    this.setup();
}

Icons.prototype = {
    check: {
        dir: function (destination, create = true) {
            if(! fs.existsSync(destination)) {
                fs.mkdirSync(destination);
            }
        }
    },
    setup: function () {
        this.check.dir(this.path.temp.root);
        this.check.dir(this.path.temp.repos);
    },
    download: function (library) {
        return new Promise((resolve, reject) => {
            var source = "direct:" + library.host.url + library.repo + library.host.archiver + library.branch;
            var destination = path.join(this.path.temp.repos, library.name);
            console.log("DIR:", destination)
            this.check.dir(destination);
            var options = { extract: true };
            var callback = (err) => {
                if (err) {
                    console.log("Error", err);
                    reject();
                } else {
                    console.log("Success, font downloaded");
                    resolve();
                }
            }
            dgr(source, destination, options, callback);
        });
    },
    update: function () {
        return new Promise(async (resolve, reject) => {
            var library;
            for (var libIndex = 0; libIndex < this.library.length; libIndex++) {
                library = this.library[libIndex];
                console.log(`Updating ${library.name} icon library.`);
                await this.download(library);
            }
            resolve();
        });
    },
    transfer: function () {
        return new Promise(async (resolve, reject) => {
            var tempRepoPath = this.path.temp.repos;
            var repos = fs.readdirSync(this.path.temp.repos);
            var name, source, destination;
            for (var repoIndex = 0; repoIndex < repos.length; repoIndex++) {
                name = repos[repoIndex];
                library = this.get().library(name);
                source = path.join(tempRepoPath, name + library.images.path);
                destination = path.join(this.path.icons, name);
                this.check.dir(destination);
                await svgfixer.fix(source, destination, {
                    showProgressBar: true
                });
            }
            console.log("tranfer complete")
            resolve();
        })
    },
    get: function () {
        var self = this;
        return {
            library: function (name) {
                return self.library.filter((i) => {
                    return i.name === name;
                })[0];
            }
        }
    },
    generate: function () {
        return new Promise(async (resolve, reject) => {
            var icon, source, destination;
            var icons = fs.readdirSync(this.path.icons);
            for (var iconIndex = 0; iconIndex < icons.length; iconIndex++) {
                var name = icons[iconIndex];
                icon = this.get().library(name);
                source = path.join(this.path.icons, name);
                destination = path.join(this.path.fonts, name);
                // console.log(source, '\n', destination)
                this.check.dir(destination);
                try {
                    var { error, stderr, output, stdout } = spawnSync(`npm`, [
                        `run`,
                        `webfont`,
                        `--`,
                        `${source}`,
                        `--template`,
                        `scss`,
                        `--font-height`,
                        "1000",
                        `--normalize`,
                        "true",
                        `--dest`,
                        `${destination}`,
                        `--font-name`,
                        `${icon.name}`,
                        `--template-class-name`,
                        `${icon.prefix}`,
                        "--verbose",
                    ]);
                } catch (e) {
                    console.log(`MAJOR ERROR:`, e);
                    throw e;
                }
        
                if (typeof output !== "undefined" && output) {
                    console.log(`output: ${output}`);
                }
        
                if (typeof stdout !== "undefined" && typeof stdout == "string") {
                    console.log(`stdout: ${stdout}`);
                }
        
                if (typeof stderr !== "undefined" && typeof stderr == "string") {
                    console.log(`stderr: ${stderr}`);
                }
        
                if (typeof error !== "undefined" && error) {
                    console.log(`error: ${error}`);
                    reject();
                    return;
                }
                console.log("generate complete")
                resolve();
            }
        })
    }
};

function sleep() {
	return new Promise((resolve) => setTimeout(resolve, 1000));
}

async function tests() {
	return new Promise(async (resolve, reject) => {
		var i;
		for (i = 0; i < 3; i++) {
			await sleep();
			console.log(i);
		}
		resolve();
	});
}

module.exports = Icons;

// function execWebfont(icon) {
//     return new Promise((resolve, reject) => {

//         var source = `${paths.repositories}/${icon.name}/${icon.images.path}/*.svg`

//         var destination = `${paths.fonts}/${icon.name}`

//         if(! fs.existsSync(`${destination}`)) {
//             fs.mkdirSync(`${destination}`)
//         }

//         try {
//             var { error, stderr, output, stdout } = spawnSync(`npm`, [
//                 `run`,`webfont`,
//                 `--`, `${source}`,
//                 `--template`, `scss`,
//                 `--font-height`, '1000',
//                 `--normalize`, 'true',
//                 `--dest`, `${destination}`,
//                 `--font-name`, `${icon.name}`,
//                 `--template-class-name`, `${icon.prefix}`,
//                 '--verbose'
//             ])
//         } catch (e) {
//             console.log(`MAJOR ERROR:`, e)
//             throw e
//         }

//         if (typeof output !== 'undefined' && output) {
//             console.log(`output: ${output}`)
//         }

//         if (typeof stdout !== 'undefined' && typeof stdout == 'string') {
//             console.log(`stdout: ${stdout}`)
//         }

//         if (typeof stderr !== 'undefined' && typeof stderr == 'string') {
//             console.log(`stderr: ${stderr}`)
//         }

//         if (typeof error !== 'undefined' && error) {
//             console.log(`error: ${error}`)
//             reject()
//             return
//         }

//         resolve()
//     })
// }

// run();
