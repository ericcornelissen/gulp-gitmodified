'use strict';

var Bottleneck = require('bottleneck'),
  exec = require('child_process').execFile,
  which = require('which');

var gitApp = 'git',
    gitExtra = {env: process.env};

var limiter = new Bottleneck({maxConcurrent: 1});

var Git = function () { };

Git.prototype.exec = function (app, args, extra, cb) {
  return limiter.submit(exec, app, args, extra, cb);
};

Git.prototype.which = function (app, cb) {
  return which(app, cb);
};

Git.prototype.getStatusByMatcher = function (matcher, baseDir, stagedOnly, cb) {
  var that = this;
  if (typeof baseDir === 'function') {
    cb = baseDir;
    baseDir = void 0;
  }
  var gitExtraOptions = gitExtra;
  if (baseDir) {
    gitExtraOptions = {
      env: gitExtra.env,
      cwd: baseDir
    };
  }

  that.which(gitApp, function (err) {
    if (err) {
      return cb(new Error('git not found on your system.'));
    }
    that.exec(gitApp, [ 'status', '--porcelain' ], gitExtraOptions, function (err, stdout) {
      if (err) {
        return cb(new Error('Could not get git status --porcelain'));
      }
      // partly inspired and taken from NPM version module
      var lines = stdout.split('\n').filter(function (line) {
        if (!stagedOnly) {
          // staged files doesn't have space in front
          line = line.trim();
        }
        return line && matcher.test(line);
      }).map(function (line) {
        return {
          mode: matcher.exec(line.trim())[0].trim(),
          path: line.trim().replace(matcher, '').trim()
        };
      });
      return cb(null, lines);
    });
  });
};

module.exports = new Git();
