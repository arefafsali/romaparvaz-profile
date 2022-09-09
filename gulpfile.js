const gulp = require("gulp");
const ts = require("gulp-typescript");
const nodemon = require("nodemon");
const pm2 = require("pm2");
require("dotenv").config();
const JSON_FILES = ["src/*.json", "src/**/*.json", "src/*.env", "src/**/*.env"];

// pull in the project TypeScript config
const tsProject = ts.createProject("tsconfig.json");

gulp.task("scripts", () => {
  const tsResult = tsProject.src().pipe(tsProject());
  return tsResult.js.pipe(gulp.dest("lib"));
});

gulp.task("nodemon", () => {
  console.log("----------- nodemon -----------");
  nodemon({
    script: "lib/index.js"
  });
});

gulp.task("pm2-stop", () => {
  console.log("----------- pm2 stop -----------");
  pm2.restart("all");
});

gulp.task("pm2", () => {
  console.log("----------- pm2 -----------");
  pm2.connect(
    true,
    function() {
      pm2.start(
        {
          name: "index",
          script: "lib/index.js"
        },
        function() {
          pm2.streamLogs("all", 0);
        }
      );
    }
  );
});

gulp.task("watch", ["scripts"], () => {
  gulp.watch("src/**/*.ts", () => {
    gulp.run("scripts");
    if (!process.env.DEV_MODE) gulp.run("pm2-stop");
    console.log("----------- Gulp Watch -----------");
  });
});

gulp.task("assets", function() {
  return gulp.src(JSON_FILES).pipe(gulp.dest("lib"));
});

gulp.task("default", ["watch", "assets"], function() {
  if (process.env.DEV_MODE) gulp.run("nodemon");
  else gulp.run("pm2");
  console.log("----------- Gulp Default -----------");
});
