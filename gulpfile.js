var gulp    = require('gulp'),
    less    = require('gulp-less'),
    concat  = require('gulp-concat'),
    clear   = require('del'),
    rename  = require('gulp-rename'),
    merge   = require('merge-stream'),
    series  = require('stream-series'),
    inject  = require('gulp-inject'),
    minifyCss       = require('gulp-minify-css'),
    minifyJs        = require('gulp-minify'),
    autoprefixer    = require('gulp-autoprefixer');

var path = {
    base: {
        deployed: './_deployed/',
        html: './content/',
        res: './res/'
    },
    src: {
        less: './less/**/*.less',
        css: './css/**/*.css',
        js: './js/',
        jsLib: './js/vendor/'
    },
    build: {
        less: './less/',
        css: './css/'
    },
    deployed: {
        content: './_deployed/content/',
        less: './_deployed/less/',
        css: './_deployed/css/',
        js: './_deployed/js/',
        jsLib: './_deployed/js/vendor/'
    }
};

gulp.task('list', function() {
    console.log('Your options:');
    console.log('- clean');
    console.log('- less-compile (default)');
    console.log('- deploy (not minified)');
    console.log('- pack (minified)');
    console.log('- index-pack');
});

gulp.task('clean', function() {
    return clear(path.base.deployed + '**/*');
});

gulp.task('less-compile', function() {
    return gulp.src(path.src.less)
        .pipe(less())
        .pipe(autoprefixer( {
            browsers: ['last 1 version']
        }))
        .pipe(gulp.dest(path.build.css));
});


gulp.task('index', function() {
    var vendorStream = gulp.src([path.src.jsLib + '*.js'], {read: false});
    var appStream = gulp.src([path.src.js + '*.js'], {read: false});

    gulp.src('index.html')
        .pipe(inject(gulp.src([path.src.css], {read: false}),
            {
                ignorePath: '_deployed',
                addRootSlash: false
            }))
        .pipe(inject(series(vendorStream, appStream), {ignorePath: '_deployed', addRootSlash: false}))
        .pipe(gulp.dest('./'));
});

gulp.task('deploy', ['clean', 'less-compile'], function() {

    return merge (
        gulp.src(path.build.css + '**/*.css')
            .pipe(concat('app.css'))
            .pipe(gulp.dest(path.deployed.css)),

        gulp.src(path.src.js + '*.js')
            .pipe(concat('app.js'))
            .pipe(gulp.dest(path.deployed.js)),

        gulp.src(path.src.jsLib + '*.js')
            .pipe(gulp.dest(path.deployed.jsLib)),

        gulp.src(['index.html', path.base.html, path.base.res])
            .pipe(gulp.dest(path.base.deployed))
    );
});

gulp.task('pack', ['less-compile', 'clean', 'deploy'], function() {
    gulp.src(path.deployed.css + '*.css')
        .pipe(minifyCss())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(path.deployed.css));

    gulp.src(path.deployed.js + '*.js')
        .pipe(minifyJs({
            ignoreFiles: ['*.min.js']
        }))
        .pipe(gulp.dest(path.deployed.js));

    clear([path.deployed.css, path.deployed.css + '!*min.css']);

    // remove app.js not working -reason?
    //clear([path.deployed.css, path.deployed.css + '!*min.css', path.deployed.js + 'app.js']);
});

gulp.task('index-pack', function() {
    var vendorStream = gulp.src([path.deployed.jsLib + '*.js'], {read: false});
    var appStream = gulp.src([path.deployed.js + '*min.js'], {read: false});

    gulp.src('index.html')
        .pipe(inject(gulp.src([path.deployed.css + '*.css'], {read: false}),
            {
                ignorePath: '_deployed',
                addRootSlash: false
            }))
        .pipe(inject(series(vendorStream, appStream), {ignorePath: '_deployed', addRootSlash: false}))
        .pipe(gulp.dest(path.base.deployed));
});

gulp.task('default', ['less-compile', 'index'], function() {
    gulp.watch(path.src.less, ['less-compile']);
});
