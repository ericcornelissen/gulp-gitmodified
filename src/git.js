const Bottleneck = require("bottleneck");
const exec = require("child_process").execFile;
const which = require("which");

const { add, git, update } = require("./keywords.js");

const defaultOptions = { env: process.env };
const limiter = new Bottleneck({ maxConcurrent: 1 });

/**
 * Execute arbitrary git commands one at the time. When
 * multiple calls are performed in quick succession the
 * git commands are automatically rate limited.
 *
 * Example:
 * ```
 * gitExecute(['add', 'myfile.txt'], options, callback);
 * // -> executes: $ git add myfile.txt
 * ```
 *
 * @param  {Array}    args     The arguments for the command in order.
 * @param  {Object}   _options Options for the command.
 *                      - gitCwd: directory containing the '.git' folder.
 * @param  {Function} callback Function called on completion.
 */
function gitExecute(args, _options, callback) {
  if (!_export.available) {
    throw new Error("git not found on your system.");
  }

  let options = Object.assign(defaultOptions, {
    cwd: _options.gitCwd || __dirname,
  });

  return limiter.submit(exec, git, args, options, callback);
}

/* === EXPORT === */

const _export = {};

let _available = null;
Object.defineProperty(_export, "available", {
  get: function() {
    if (_available === null) {
      let result = which.sync(git, { nothrow: true });
      _available = !(result === null);
    }

    return _available;
  },
});

/**
 * @param  {String}   file     The path to the file to stage.
 * @param  {Object}   config   Configuration of the stage action.
 *                      - gitCwd: directory containing the '.git' folder.
 *                      - stagedOnly: only stage previously staged files.
 * @param  {Function} callback The function to call on completion.
 */
_export.stage = function(file, config, callback) {
  if (typeof file !== "string") {
    callback("file must be a string.");
  } else {
    const args = [add];
    if (config.stagedOnly) args.push(update);
    args.push(file);

    gitExecute(args, config, callback);
  }
};

module.exports = _export;
