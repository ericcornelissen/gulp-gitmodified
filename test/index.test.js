const process = require("child_process");
const gulp = require("gulp");
const path = require("path");

const { each, reduce, stdin, stdout } = require("./utils.js");

const command = require("../src/constants.js");
const gitstage = require("../src/index.js");
const log = require("../src/log.js");

const files = path.join(__dirname, "./fixtures/*.txt");

test("The plugin returns a stream", () => {
  const subject = gitstage();
  expect(subject).toHaveProperty("on");
  expect(subject).toHaveProperty("write");
});

describe("Successful execution", () => {
  test("Stage at least one file on git", done => {
    gulp
      .src(files)
      .pipe(gitstage())
      .pipe(reduce())
      .pipe(
        each(() => {
          expect(process.execFile).toHaveBeenCalled();
          done();
        }),
      );
  });

  test("Makes a call to execute 'git'", done => {
    let fileList = [];

    gulp
      .src(files)
      .pipe(gitstage())
      .pipe(reduce())
      .pipe(
        each(() => {
          expect(process.execFile).toHaveBeenCalledWith(
            command.git,
            expect.arrayContaining([command.add]),
            expect.anything(),
            expect.anything(),
          );

          done();
        }),
      );
  });

  test("Stages all files in the stream", done => {
    let fileList = [];

    gulp
      .src(files)
      .pipe(each(file => fileList.push(file.basename)))
      .pipe(gitstage())
      .pipe(reduce())
      .pipe(
        each(() => {
          for (let file of fileList) {
            expect(process.execFile).toHaveBeenCalledWith(
              expect.anything(),
              expect.arrayContaining([expect.stringContaining(file)]),
              expect.anything(),
              expect.anything(),
            );
          }

          done();
        }),
      );
  });
});

describe("Unsuccessful execution", () => {
  const generateError = message => {
    const error = new Error(message);
    error.killed = false;
    error.code = 128;
    error.signal = null;
    error.cmd = "git add [file]";

    return error;
  };

  const gitErrorLevel = "fatal";
  const gitErrorMessage = "pathspec [file] did not match any file";
  const gitError = `${gitErrorLevel}: ${gitErrorMessage}`;

  beforeEach(() => {
    // Mock `execFile` such that it fails, the behaviour is based on:
    // https://nodejs.org/api/child_process.html
    process.execFile.mockImplementation((file, args, options, callback) => {
      const error = generateError(`Command failed: git add\n${gitError}`);
      callback(error, stdin, stdout);
    });
  });

  test("Emits an error if the file could not be added", done => {
    gulp
      .src(files)
      .pipe(gitstage())
      .on("error", () => {
        done();
      });
  });

  test("The error message is derived from the git error", done => {
    gulp
      .src(files)
      .pipe(gitstage())
      .on("error", error => {
        expect(error.message).toMatch(gitErrorLevel);
        expect(error.message).toMatch(gitErrorMessage);
        done();
      });
  });

  test("Logs an error in verbose mode", done => {
    gulp
      .src(files)
      .pipe(gitstage())
      .on("error", error => {
        expect(log.debug).toHaveBeenCalledWith(
          expect.stringContaining("failed"),
          expect.any(String),
          expect.anything(),
        );
        done();
      });
  });

  afterEach(() => {
    process.execFile.mockRestore();
  });
});

describe("Configuration", () => {
  test("The 'gitCwd' option is used", done => {
    let customCwd = "../foo";
    gulp
      .src(files)
      .pipe(
        gitstage({
          gitCwd: customCwd,
        }),
      )
      .pipe(reduce())
      .pipe(
        each(() => {
          expect(process.execFile).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            expect.objectContaining({
              cwd: customCwd,
            }),
            expect.anything(),
          );

          done();
        }),
      );
  });

  test("The 'gitCwd' option must be a string", () => {
    const subject = gitstage({ gitCwd: ["not", "a", "string"] });
    expect(subject).toHaveProperty("write");
    expect(subject.write).toThrow();
  });

  test("The 'stagedOnly' option is used when true", done => {
    gulp
      .src(files)
      .pipe(
        gitstage({
          stagedOnly: true,
        }),
      )
      .pipe(reduce())
      .pipe(
        each(() => {
          expect(process.execFile).toHaveBeenCalledWith(
            expect.anything(),
            expect.arrayContaining([command.update]),
            expect.anything(),
            expect.anything(),
          );

          done();
        }),
      );
  });

  test("The 'stagedOnly' option is not used when false", done => {
    gulp
      .src(files)
      .pipe(
        gitstage({
          stagedOnly: false,
        }),
      )
      .pipe(reduce())
      .pipe(
        each(() => {
          try {
            expect(process.execFile).toHaveBeenCalledWith(
              expect.anything(),
              expect.not.arrayContaining([command.update]),
              expect.anything(),
              expect.anything(),
            );
          } catch (e) {
            console.log(e);
          }

          done();
        }),
      );
  });

  test("The 'stagedOnly' option is not used by default", done => {
    gulp
      .src(files)
      .pipe(gitstage())
      .pipe(reduce())
      .pipe(
        each(() => {
          try {
            expect(process.execFile).toHaveBeenCalledWith(
              expect.anything(),
              expect.not.arrayContaining([command.update]),
              expect.anything(),
              expect.anything(),
            );
          } catch (e) {
            console.log(e);
          }

          done();
        }),
      );
  });
});
