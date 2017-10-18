var gulp           = require('gulp'),
		gutil          = require('gulp-util' ),
		sass           = require('gulp-sass'),
		jade           = require('gulp-jade'),
		browserSync    = require('browser-sync'),
		concat         = require('gulp-concat'),
		uglify         = require('gulp-uglify'),
		cleanCSS       = require('gulp-clean-css'),
		rename         = require('gulp-rename'),
		del            = require('del'),
		imagemin       = require('gulp-imagemin'),
		cache          = require('gulp-cache'),
		autoprefixer   = require('gulp-autoprefixer'),
		ftp            = require('vinyl-ftp'),
		plumber        = require("gulp-plumber"),
		path           = require('path');
		data           = require('gulp-data');
		notify         = require("gulp-notify");


// Директории проекта

var settings = {
    publicDir: '_site',
    sassDir: '_sass',
    layoutDir: '_layouts',
    libsDir: 'libs',
    jsDir: '_js',
    partialsDir: '_layouts/_partials',
    dataDir: '_layouts/_data',
    cssDir: '_site/assets/css',
}

// Скрипты проекта

//SASS
gulp.task('sass', function() {
	return gulp.src(settings.sassDir + "/**/*.sass")
		.pipe(sass({outputStyle: 'expand'}))
		.pipe(plumber({
		    errorHandler: settings.systemNotify ? notify.onError("Error: <%= error.messageOriginal %>") : function(err) {
		        console.log(" ************** \n " + err.messageOriginal + "\n ************** ");
		        this.emit('end');
		    }
		}))
		.pipe(rename({suffix: '.min', prefix : ''}))
		.pipe(autoprefixer(['last 15 versions']))
		.pipe(cleanCSS()) // Опционально, закомментировать при отладке
		.pipe(gulp.dest(settings.cssDir))
		.pipe(browserSync.reload({stream: true}));
});
//SASS

//JADE
gulp.task('jade', function() {
	return gulp.src(settings.layoutDir + "/*.jade")
    .pipe(data(function (file) {
        return require('./_layouts/_data/' + path.basename(file.path) + '.json');
    }))
    .pipe(plumber({
        errorHandler: settings.systemNotify ? notify.onError("Error: <%= error %>") : function(err) {
            console.log("************** \n " + err + "\n **************");
            this.emit('end');
        }
    }))
    .pipe(jade({
        pretty: true
    }))
    .pipe(gulp.dest(settings.publicDir))
    .pipe(browserSync.stream());
});
//JADE

//JS
gulp.task('common-js', function() {
	return gulp.src([
		settings.jsDir + '/common.js',
		])
	.pipe(concat('common.min.js'))
	.pipe(uglify())
	.pipe(gulp.dest(settings.jsDir));
});

gulp.task('js', ['common-js'], function() {
	return gulp.src([
		settings.libsDir + '/jquery/dist/jquery.min.js', //подключаем плагины
		settings.jsDir + '/common.min.js', // Всегда в конце
		])
	.pipe(concat('scripts.min.js'))
	// .pipe(uglify()) // Минимизировать весь js (на выбор)
	.pipe(gulp.dest(settings.publicDir + '/assets/js'))
	.pipe(browserSync.reload({stream: true}));
});
//JS

//Browser-Sync
gulp.task('browser-sync', function() {
	browserSync({
		server: {
			baseDir: settings.publicDir
		},
		notify: false,
		// tunnel: true,
		// tunnel: "projectmane", //Demonstration page: http://projectmane.localtunnel.me
	});
});
//Browser-Sync

// MAIN TASK
gulp.task('watch', ['sass', 'js', 'browser-sync'], function() {
	gulp.watch(settings.sassDir + "/**/*.sass", ['sass']);
	gulp.watch([settings.libsDir + "/**/*.js", settings.jsDir + '/common.js'], ['js']);
	gulp.watch([settings.layoutDir + "/*.jade", settings.partialsDir + "/*.jade", settings.dataDir + "/*.jade.json"], ['jade']);
});
// MAIN TASK

// IMAGE MINIFY
gulp.task('imagemin', function() {
	return gulp.src(settings.publicDir + '/assets/img/**/*')
	.pipe(cache(imagemin()))
	.pipe(gulp.dest('dist/assets/template/img'));
});
// IMAGE MINIFY

// BUILD PROJECT
gulp.task('build', ['removedist', 'imagemin', 'sass', 'js'], function() {

	var buildFiles = gulp.src([
		settings.publicDir + '/*.html',
		settings.publicDir + '/ht.access',
	]).pipe(gulp.dest('dist/assets/template'));

	var buildCss = gulp.src([
		settings.publicDir + '/assets/css/main.min.css',
		]).pipe(gulp.dest('dist/assets/template/css'));

	var buildJs = gulp.src([
		settings.publicDir + '/assets/js/scripts.min.js',
		]).pipe(gulp.dest('dist/assets/template/js'));

	var buildFonts = gulp.src([
		settings.publicDir + '/assets/fonts/**/*',
		]).pipe(gulp.dest('dist/assets/template/fonts'));

});
// BUILD PROJECT

// PROJECT DEPLOY
gulp.task('deploy', function() {

	var conn = ftp.create({
		host:      'hostname.com',
		user:      'username',
		password:  'userpassword',
		parallel:  10,
		log: gutil.log
	});

	var globs = [
	'dist/**',
	'dist/ht.access',
	];
	return gulp.src(globs, {buffer: false})
	.pipe(conn.dest('/path/to/folder/on/server'));

});
// PROJECT DEPLOY

// DELETE DIST DIR
gulp.task('removedist', function() { return del.sync('dist'); });
// DELETE DIST DIR

// CLEAR CACHE
gulp.task('clearcache', function () { return cache.clearAll(); });
// CLEAR CACHE
