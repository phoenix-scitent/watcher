const watchify = require('watchify');
const browserify = require('browserify');
const babelify = require('babelify');
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const util = require('gulp-util');
const size = require('gulp-size');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const R = require('ramda');

const destpath = 'examples';

const customOpts = {
  entries: ['./example.js'],
  debug: true,
  transform: [['babelify', { presets: ['es2015'] }]]
};

const opts = R.merge(watchify.args, customOpts);

const browserification = watchify(browserify(opts));

browserification.on('log', util.log);

gulp.task('bundle', [], function(){
  return browserification.bundle()
      .on('error', function(err){ console.log(err.message); this.emit('end'); })
      .pipe(plumber())
      .pipe(source('watcher.js'))
      .pipe(buffer())
      .pipe(size())
      .pipe(gulp.dest(destpath));
});

gulp.task('watch', ['bundle'], function(){
  gulp.watch('./src/**/*', []).on('change', function(event){
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
  });
});