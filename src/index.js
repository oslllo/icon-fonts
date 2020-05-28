const fs = require("fs-extra");
const dgr = require("download-git-repo");
const Nodegit = require("nodegit");
const Github = require("github-api");
const path = require("path");
const colors = require("colors");
const { spawnSync, exec } = require("child_process");
const svgfixer = require("oslllo-svg-fixer");
const _ = require("lodash");

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
	};
	this.repo = new Object;
	this.manifest = {
		path: "undefined",
		exists: false,
		data: {},
		hasTags: false,
		outdated: true,
	};
	this.library = library;
	this.setup();
}

Font.prototype = {
	setup: function() {
		this.library.host = this.host[this.library.host];
		this.checkPath(this.path.temp.root);
		this.checkPath(this.path.temp.repos);
		this.storage = {
			path: this.getPath("storage", this.library, "", true)
		};
		this.manifest =  Object.assign(this.manifest, {
			save: () => {
				fs.writeFileSync(this.manifest.path, JSON.stringify(this.manifest.data, null, 2));
			},
			load: () => {
				this.manifest.data = JSON.parse(fs.readFileSync(this.manifest.path));
			},
			commits: () => {
				return {
					add: (commit) => {
						this.manifest.data.commits.unshift(commit);
					},
					latest: () => {
						return this.manifest.data.commits[0];
					}
				}
			}
		});
		this.repo = Object.assign(this.repo, {
			data: new Object,
			init: () => {
				const github = new Github();
				this.repo.instance = github.getRepo(
					this.library.repo.owner,
					this.library.repo.name
				);
			},
			tags: () => {
				return {
					exist: () => {
						return Boolean(this.repo.data.tags.length);
					},
					latest: () => {
						return this.repo.data.tags.length ? this.repo.data.tags[0] : null;
					},
					fetch: async (set = false) => {
						var tags = await this.repo.instance.listTags();
						var data = tags.data;
						if (set) {
							this.repo.set().tags(data);
						} else {
							return data;
						}
					}
				}
			},
			commits: (commits) => {
				return {
					fetch: async (sha, set = false) => {
						if (sha) {
							var commit = await this.repo.instance.getCommit(sha);
							var data = commit.data;
						}
						var commits = await this.repo.instance.listCommits({
							path: this.library.images.path
						});
						var data = commits.data;
						data = Array.isArray(data) ? data : [data];
						if (set) {
							this.repo.set().commits(data);
						}
						return data;
					},
					latest: () => {
						return this.repo.data.commits[0]
					},
					setTag: (tag) => {
						commits.tag = tag;
						return commits;
					}
				}
			},
			set: () => {
				return {
					tags: (tags) => {
						this.repo.data.tags = tags;
					},
					commits: (commits) => {
						this.repo.data.commits = commits;
					}
				}
			}
		});
	},
	check: function () {
		return {
			dir: function(destination, create = true) {
				if (fs.existsSync(destination) == false) {
					fs.mkdirSync(destination);
				}
			}
		}
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
		if ((exists == false) && create) {
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

			this.manifest.path = path.join(this.storage.path, "manifest.json");
			this.manifest.exists = fs.existsSync(this.manifest.path);
			// console.log(this.manifest.exists);
			// return

			// fs.removeSync(this.manifest.path); //! DEBUG FUNCTION !!!!!!

			try {

				// this.repo.instance = github.getRepo(
				// 	library.repo.owner,
				// 	library.repo.name
				// );

				this.repo.init();

				await this.repo.tags().fetch(true);

				// var listTags = await this.repo.instance.listTags();
				// this.repo.tags = listTags.data;

				if (this.manifest.exists == false) {
					console.log(colors.brightYellow(`Found new library ${library.name}, setting up files.`));
					if (this.repo.tags().exist()) {
						var latestTagSha = this.repo.tags().latest().commit.sha;
						await this.repo.commits().fetch(latestTagSha, true);
						// var commit = await this.repo.commits().fetch(latestTagSha);
						// this.repo.commits = [commit];
						this.manifest.hasTags = true;
					} else {
						await this.repo.commits().fetch(null, true);
						// this.repo.commits = await this.repo.commits().fetch();
						this.manifest.hasTags = false;
					}
					// var latestCommit = this.repo.commits[0];
					var latestCommit = this.repo.commits().latest();
					latestCommit = this.repo.commits(latestCommit).setTag(this.repo.tags().latest());
					// latestCommit.tag = this.repo.tags().latest();
					this.manifest.data = { commits: [latestCommit] };
					this.manifest.save();
					this.manifest.load();
				} else {
					this.manifest.load();
					var latestManifestCommitSha = this.manifest.commits().latest().sha;
					if (this.manifest.hasTags) {
						if (this.repo.tags().latest().commit.sha !== latestManifestCommitSha) {
							this.manifest.outdated = true;
						} else {
							this.manifest.outdated = false;
						}
					} else {
						if (this.repo.commits().latest().sha !== latestManifestCommitSha) {
							this.manifest.outdated = true;
						} else {
							this.manifest.outdated = false;
						}
					}
				}

				if (this.manifest.outdated == false) {
					console.log(
						colors.brightGreen(
							`${library.name} is up to date, skipping repository download.`
						)
					);
					resolve({ destination });
					return;
				}

				// var setupMessage = () => {

				// }

				var latestRepoCommit = this.repo.commits().latest();
				var latestManifestCommit = this.manifest.commits().latest();

				if (this.manifest.exists) {
					console.log(colors.brightYellow(`Updating ${library.name} to commit ${latestRepoCommit.sha}`));
				} else {
					console.log(colors.brightYellow(`Setting up ${library.name} at commit ${latestRepoCommit.sha}`));
				}

				var callback = (err) => {
					if (err) {  
						console.log(colors.red("Error downloading library repository"), err);
						reject({ err });
					} else {
						this.manifest.commits().add(this.manifest.commits().latest());

						if (this.manifest.exists) {
							console.log(
								colors.brightGreen(
									`${library.name} was successfully updated from commit '${latestManifestCommit.sha}' => ${latestRepoCommit.sha}.`
								)
							);
						} else {
							console.log(
								colors.brightGreen(
									`${library.name} was successfully updated from commit '${latestManifestCommit.sha}' => ${latestRepoCommit.sha}.`
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
	update: function(version) {
		return new Promise(async (resolve, reject) => {
			var library = this.library;
			console.log(
				colors.brightBlue(`Checking for ${library.name} icon library updates.`)
			);
			var download = await this.download(library, version);
			resolve();
		});
	},
	optimize: function() {
		return new Promise(async (resolve, reject) => {
			var library = this.library;
			var source = path.join(this.path.temp.repos, path.join(library.name, library.images.path));
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
		console.log("Test", path.resolve("temp"));
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

module.exports = Font;
