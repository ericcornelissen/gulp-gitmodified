const map = require("map-stream");
const PluginError = require("plugin-error");

const git = require("./git.js");
const { errorTag } = require("./constants.js");

module.exports = function(config = {}) {
  return map((file, callback) => {
    if (!git.available) {
      let error = new PluginError(errorTag, "git not found on your system.");
      return callback(error);
    }

    if (config.gitCwd !== undefined && typeof config.gitCwd !== "string") {
      let error = new PluginError(errorTag, "'gitCwd' must be a string.");
      return callback(error);
    }

    git.stage(file.path, config, error => {
      if (error) {
        let errorMessage = error.message.split(/\n/)[1];
        let [code, message] = errorMessage.split(/:\s/);

        error = new PluginError(
          errorTag,
          `git add failed: ${message} (${code}).`,
        );

        return callback(error);
      }

      callback(0, file);
    });
  });
};
