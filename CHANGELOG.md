# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

## [1.1.0] - 2019-03-14

Cleaned up original version and fixed the first bug 👌

### Fixed

- Package description in `package.json`.
- Adding multiple files in quick succession caused the plugin to crash. (#14)
- Check only once if `git` is available on the PATH. (#17)
- Reduce install size as dependency. (#12)

### Security

- Audited package dependencies. (#11)

## [1.0.0] - 2019-03-10

Adapted [gulp-gitmodified](https://github.com/mikaelbr/gulp-gitmodified) to
create a gulp plugin to stage files 🎉

### Added

- Stage files with git in the gulp object stream.
- Examples of how to use the plugin.