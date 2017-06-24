'use strict';
// PostCSS plugin to parse CSS and add vendor prefixes to CSS rules using values from Can I Use
var autoprefixer = require('autoprefixer');
// Browser-side require() the node.js way
var browserify = require('browserify');
// Keep multiple browsers & devices in sync when building websites
var browserSync = require('browser-sync').create();
// Convert streaming vinyl files to use buffers
var buffer = require('vinyl-buffer');
// Minify CSS with CSSO
var csso = require('gulp-csso');
// Delete files and folders
var del = require('del');
// Gulp is a toolkit that helps you automate painful or time-consuming tasks in your development workflow
var gulp = require('gulp');
// Conditionally run a task
var gulpIf = require('gulp-if');
// PostCSS plugin to inline local/remote images
var imageInliner = require('postcss-image-inliner');
// Minify PNG, JPEG, GIF and SVG images with imagemin
var imagemin = require('gulp-imagemin');
// Pack same CSS media query rules into one using PostCSS
var mqpacker = require('css-mqpacker');
// Prevent pipe breaking caused by errors from gulp plugins
var plumber = require('gulp-plumber');
// Gulp plugin to pipe CSS through several plugins
var postcss = require('gulp-postcss');
// Gulp plugin to rename files
var rename = require('gulp-rename');
// Runs a sequence of gulp tasks in the specified order
var runSequence = require('run-sequence');
// Sass plugin for Gulp.
var sass = require('gulp-sass');
// Use conventional text streams at the start of your gulp or vinyl pipelines
var source = require('vinyl-source-stream');
// Source map support for Gulp
var sourcemaps = require('gulp-sourcemaps');
// Optimizing SVG vector graphics files
var svgo = require('gulp-svgo');
// Minify JavaScript with UglifyJS2
var uglify = require('gulp-uglify');

var isProduction = process.env.NODE_ENV === 'production' ? true : false;

var SRC_FOLDER = 'source';
var BUILD_FOLDER = 'build';

var path = {
  build: {
    css: BUILD_FOLDER + '/css',
    html: BUILD_FOLDER,
    fonts: BUILD_FOLDER + '/fonts',
    js: BUILD_FOLDER + '/js',
    img: BUILD_FOLDER + '/img'
  },
  src: {
    html: {
      self: SRC_FOLDER + '/*.html'
    },
    sass: {
      self: SRC_FOLDER + '/sass/style.scss',
      folder: SRC_FOLDER + '/sass/**/*.scss'
    },
    js: {
      self: SRC_FOLDER + '/js/main.js',
      folder: SRC_FOLDER + '/js/**/*.js'
    },
    fonts: {
      folder: SRC_FOLDER + '/fonts/**/*.*'
    },
    images: {
      svg: SRC_FOLDER + '/img/**/*.svg',
      self: SRC_FOLDER + '/img',
      folder: SRC_FOLDER + '/img/**/*.{png,jpg,gif}',
      root: SRC_FOLDER + '/img/*.{png,jpg,gif,svg}',
      favicons: SRC_FOLDER + '/img/favicons/*.*'
    }
  }
};

gulp.task('html', function () {
  return gulp.src(path.src.html.self)
    .pipe(gulp.dest(path.build.html))
    .pipe(browserSync.stream());
});

gulp.task('style', function () {
  return gulp.src(path.src.sass.self)
    .pipe(plumber())
    .pipe(gulpIf(!isProduction, sourcemaps.init()))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpIf(!isProduction, sourcemaps.write()))
    .pipe(postcss([
      autoprefixer({browsers: [
        'last 2 versions',
        '> 1%'
      ]}),
      imageInliner({
        assetPaths: [path.src.images.self],
        maxFileSize: 10240,
      }),
      mqpacker({
        sort: false
      })
    ]))
    .pipe(gulp.dest(path.build.css))
    .pipe(gulpIf(isProduction, csso()))
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest(path.build.css))
    .pipe(browserSync.stream());
});

gulp.task('js', function () {
  return browserify(path.src.js.self, {debug: !isProduction})
    .bundle()
    .on('error', function (err) {
      /* eslint-disable */
      console.log(err.toString());
      this.emit('end');
      /* eslint-enable */
    })
    .pipe(source('script.js'))
    .pipe(gulp.dest(path.build.js))
    .pipe(buffer())
    .pipe(gulpIf(isProduction, uglify()))
    .pipe(rename('script.min.js'))
    .pipe(gulp.dest(path.build.js))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('serve', function () {
  browserSync.init({
    server: './' + BUILD_FOLDER,
    notify: false,
    open: false,
    ui: false
  });

  gulp.watch(path.src.html.self, ['html']);
  gulp.watch(path.src.sass.folder, ['style']);
  gulp.watch(path.src.js.folder, ['js']);
  gulp.watch(path.src.images.root, ['copy']);
});

gulp.task('imagemin', function () {
  return gulp.src(path.src.images.folder)
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true})
    ], {verbose: true}))
    .pipe(gulp.dest(path.src.images.self));
});

gulp.task('svgmin', function () {
  return gulp.src(path.src.images.svg)
    .pipe(svgo())
    .pipe(gulp.dest(path.src.images.self));
});

gulp.task('clean', function () {
  return del(BUILD_FOLDER);
});

gulp.task('copy', function () {
  return gulp.src([
    path.src.fonts.folder,
    path.src.images.root,
    path.src.images.favicons
  ], {base: SRC_FOLDER})
    .pipe(gulp.dest(BUILD_FOLDER));
});

gulp.task('build', function (fn) {
  runSequence('clean', 'copy', 'html', 'style', 'js', fn);
});
