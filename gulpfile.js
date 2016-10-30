//TODO setup build process
var gulp = require('gulp');
var karma = require('karma');
var connect = require('gulp-connect');
 
/**
 * Run test once and exit
 */
gulp.task('tdd', function (done) {
  new karma({
    configFile: __dirname + '/karma.conf.js',
  }, done).start();
});

gulp.task('test', function (done) {
  new karma({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
});


  
gulp.task('serve', function() {
  connect.server({
    root: '',
    livereload: true
  });
});
 
