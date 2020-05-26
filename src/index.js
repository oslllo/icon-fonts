const fs = require("fs-extra");
const dgr = require("download-git-repo");
const Nodegit = require("nodegit");
const Github = require("github-api");
const path = require("path");
const colors = require("colors");
const { spawnSync, exec } = require("child_process");
const svgfixer = require("oslllo-svg-fixer");

function Font(library) {
	this.host = {
		github: {
			url: "https://github.com",
			archiver: "zipball",
		},
	};
	this.path = {
		temp: (function() {
			var root = path.resolve("temp");
			var repos = path.join(root, "/repos");
			return { root, repos };
		})(),
		library: path.resolve("src/assets/library"),
		// fonts: path.resolve("src/assets/fonts"),
		// icons: path.resolve("src/assets/icons"),
	};
	this.library = library;
	this.library.host = this.host[this.library.host];
	this.setup();
}

Font.prototype = {
	check: function () {
		return {
			dir: function(destination, create = true) {
				if (!fs.existsSync(destination)) {
					fs.mkdirSync(destination);
				}
			}
		}
	},
	setup: function() {
		// this.check().dir(this.path.temp.root);
		// this.check().dir(this.path.temp.repos);
		this.checkPath(this.path.temp.root);
		this.checkPath(this.path.temp.repos);
	},
	setOptions: function(set, options) {
		for (var opt in options) {
			if (options.hasOwnProperty(opt)) {
				set[opt] = opt;
			}
		}
	},
	checkPath: function (p, create = true) {
		var exists = fs.existsSync(p);
		if (!exists && create) {
			fs.mkdirSync(p);
		}
		return exists;
	},
	download: function(library, options) {
		return new Promise(async (resolve, reject) => {
			var source =
				"direct:" +
				library.host.url + "/" +
				library.repo.owner + "/" +
				library.repo.name + "/" +
				library.host.archiver + "/" +
				library.branch;
			var destination = path.join(this.path.temp.repos, library.repo.name);

			if (fs.existsSync(destination)) {
				fs.removeSync(destination);
			}

			var storage = this.getPath("storage", library, "", true);
			var commitJSONPath = path.join(storage, "commit.json");
			fs.removeSync(commitJSONPath); //! DEBUG FUNCTION !!!!!!
			try {
				const github = new Github();

				var onlineRepository = github.getRepo(
					library.repo.owner,
					library.repo.name
				);

				var onlineRepositoryCommits = await onlineRepository.listCommits({
					path: library.images.path,
				});

				var onlineRepositoryLatestCommit = onlineRepositoryCommits.data[0];
				var hasCommitJSON = fs.existsSync(commitJSONPath);

				function saveCommitJSON(cJSON) {
					fs.writeFileSync(commitJSONPath, JSON.stringify(cJSON, null, 2));
				}

				if (!hasCommitJSON) {
					console.log(colors.brightYellow(`Setting up ${library.name} files.`));
					var commitJSON = { data: [onlineRepositoryLatestCommit] };
					saveCommitJSON(commitJSON);
				} else {
					var commitJSON = JSON.parse(fs.readFileSync(commitJSONPath));
				}

				var commitJSONLatestCommit = commitJSON.data[0];
				var libraryIsUpToDate =
					onlineRepositoryLatestCommit.sha === commitJSONLatestCommit.sha;

				if (libraryIsUpToDate && hasCommitJSON) {
					console.log(
						colors.brightGreen(
							`${library.name} is up to date, skipping repository download.`
						)
					);
					return;
				}

				if (hasCommitJSON) {
					console.log(colors.brightYellow(`Updating ${library.name} to commit ${onlineRepositoryLatestCommit.sha}`));
				} else {
					console.log(colors.brightYellow(`Setting up ${library.name} at commit ${onlineRepositoryLatestCommit.sha}`));
				}

				var callback = (err) => {
					if (err) {  
						console.log(colors.red("Error"), err);
						reject({ err });
					} else {
						commitJSON.data.unshift(onlineRepositoryLatestCommit)
						saveCommitJSON(commitJSON);
						if (hasCommitJSON) {
							console.log(
								colors.brightGreen(
									`${library.name} was successfully updated from commit '${commitJSONLatestCommit.sha}' => ${onlineRepositoryLatestCommit.sha}.`
								)
							);
						} else {
							console.log(
								colors.brightGreen(
									`${library.name} was successfully updated from commit '${commitJSONLatestCommit.sha}' => ${onlineRepositoryLatestCommit.sha}.`
								)
							);
						}
						resolve({ destination });
					}
				};
				dgr(source, destination, options, callback);
			} catch (e) {
				console.log(e);
				reject({ err: e })
			}
		});
	},
	update: function() {
		return new Promise(async (resolve, reject) => {
			var library = this.library;
			console.log(
				colors.brightBlue(`Checking for ${library.name} icon library updates.`)
			);
			var download = await this.download(library);
			resolve();
		});
	},
	optimize: function() {
		return new Promise(async (resolve, reject) => {
			var library = this.library;
			var source = path.join(this.path.temp.repos, path.join(library.name, library.images.path));
			// var source = this.getPath("temp", library, library.images.path);
			var destination = this.getPath("storage", library, "svgs", true);
			await svgfixer.fix(source, destination, {
				showProgressBar: true,
			});
			console.log("optimization complete");
			resolve();
		});
	},
	getPath(to, library, folder = "", create = false) {
		var p;
		var f = path.join(library.name, folder);
		switch(to) {
			case "storage":
			p = path.join(path.resolve("src/assets/library"), f);
			break;
			case "temp":
			p = path.join(path.resolve("temp"), f);
			break;
			default:
				throw new TypeError(`Invalid path type '${to}' given.`);
		}
		this.checkPath(p, create);

		return p;
	},
	generate: function() {
		return new Promise(async (resolve, reject) => {
			var library = this.library;
			var source = this.getPath("storage", library, "svgs", true);
			var destination = this.getPath("storage", library, "font", true);
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
					`${library.name}`,
					`--template-class-name`,
					`${library.prefix}`,
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
			console.log("generate complete");
			resolve();
		});
	},
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

module.exports = Font;
