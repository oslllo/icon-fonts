const fs = require("fs-extra");
const dgr = require("download-git-repo");
const Nodegit = require("nodegit");
const Github = require("github-api");
const path = require("path");
const colors = require("colors");
const { spawnSync, exec } = require("child_process");
const svgfixer = require("oslllo-svg-fixer");

function Font() {
	(this.options = {}),
		(this.host = {
			github: {
				url: "https://github.com",
				archiver: "zipball",
			},
		});
	this.path = {
		temp: (function() {
			var root = path.resolve("temp");
			var repos = path.join(root, "/repos");
			return { root, repos };
		})(),
		library: path.resolve("src/assets/library"),
		fonts: path.resolve("src/assets/fonts"),
		icons: path.resolve("src/assets/icons"),
	};
	this.library = [
		{
			name: "feather",
			host: this.host.github,
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
			host: this.host.github,
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
		this.check().dir(this.path.temp.root);
		this.check().dir(this.path.temp.repos);
	},
	setOptions: function(set, options) {
		for (var opt in options) {
			if (options.hasOwnProperty(opt)) {
				set[opt] = opt;
			}
		}
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

			var storage = this.get().path("storage", library, "", true);
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
			var library;
			for (var libIndex = 0; libIndex < this.library.length; libIndex++) {
				library = this.library[libIndex];
				console.log(
					colors.brightBlue(`Checking for ${library.name} icon library updates.`)
				);
				var download = await this.download(library);
			}
			resolve();
		});
	},
	fixAndTransferSvgs: function() {
		return new Promise(async (resolve, reject) => {
			// var tempRepoPath = this.path.temp.repos;
			var repos = fs.readdirSync(this.path.temp.repos);
			// var repos = this.library
			var name, source, destination;
			for (var repoIndex = 0; repoIndex < repos.length; repoIndex++) {
				name = repos[repoIndex];
				library = this.get().library(name);
				source = this.get().path("temp", library, library.images.path);
				// source = path.join(tempRepoPath, library.name + "/" + library.images.path);
				destination = this.get().path("storage", library, "svgs", true);
				await svgfixer.fix(source, destination, {
					showProgressBar: true,
				});
			}
			console.log("tranfer complete");
			resolve();
		});
	},
	get: function() {
		var self = this;
		return {
			library: function(name) {
				return self.library.filter((i) => {
					return i.name === name;
				})[0];
			},
			path: function (type, library, folder = "", check = false) {
				var p;
				switch(type) {
					case "storage":
						p = path.join(self.path.library, path.join(library.name, folder));
					break;
					case "temp":
						p = path.join(self.path.temp.repos, path.join(library.name, folder));
					break;
					default:
						throw new TypeError(`Invalid path type '${type}' given.`);
				}
				if (check) {
					self.check().dir(p);
				}
				return p;
			}
		};
	},
	generate: function() {
		return new Promise(async (resolve, reject) => {
			var library, source, destination;
			var libraries = fs.readdirSync(this.path.library);
			for (var i = 0; i < libraries.length; i++) {
				var name = libraries[i];
				library = this.get().library(name);
				source = this.get().path("storage", library, "svgs", true);
				destination = this.get().path("storage", library, "font", true);
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
			}
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
