


var paths = {
	temp: (function() {
		var root = path.resolve("temp");
		var repos = path.join(root, "/repos");
		return { root, repos };
	})(),
	library: path.resolve("src/assets/library"),
	fonts: path.resolve("src/assets/fonts"),
    icons: path.resolve("src/assets/icons"),
    storage: function (library) {

    }
};

module.exports = paths;
