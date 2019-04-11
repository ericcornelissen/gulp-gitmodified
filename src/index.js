const map = require("map-stream");
const path = require("path");
const PluginError = require("plugin-error");

const { pluginTag, types } = require("./constants.js");
const git = require("./git.js");
const log = require("./log.js");

/**
 * Exposes the plugin 'gitstage' to be used in {@link https://gulpjs.com/ Gulp}.
 * The plugin will {@link https://git-scm.com/docs/git-add stage} all files in
 * the stream (unless configured otherwise) to a {@link https://git-scm.com/
 * git} repository.
 *
 * @exports gulp-gitstage
 * @param  {String} [gitCwd=cwd] - Override from which directory git is executed.
 * @param  {Boolean} [stagedOnly=false] - Only stage previously staged files.
 * @return {Stream} Identity file stream, does not modify the input.
 */
module.exports = function(config = {}) {
  const streamId = Math.random();

  log.debug("creating stream [id=%f], config: %O", streamId, config);
  return map((_file, callback) => {
    const gitRoot = path.resolve(_file.cwd, config.gitCwd || "");
    const file = path.relative(gitRoot, _file.path);

    if (config.gitCwd && typeof config.gitCwd !== types.string) {
      const error = new PluginError(errorTag, "'gitCwd' must be a string.");
      return callback(error);
    }

    log.debug("staging '%s'", file);
    git.stage(file, config, streamId, error => {
      if (error) {
        log.debug("stage failed on '%s' | %O", file, error);

        const errorMessage = error.message.split(/\n/)[1];
        const [code, message] = errorMessage.split(/:\s/);

        error = new PluginError(
          pluginTag,
          `git add failed: ${message} (${code}).`,
        );

        callback(error);
      } else {
        log.debug("staged '%s'", file);
        callback(0, file);
      }
    });
  });
};
