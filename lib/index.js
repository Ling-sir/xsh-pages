const del = require('del')
const browser = require('browser-sync')

const {
  src,
  dest,
  series,
  parallel,
  watch
} = require('gulp')

const loadPlgins = require('gulp-load-plugins')
const plugins = loadPlgins()
const bs = browser.create()
const cwd = process.cwd() // 项目目录
let config = {
  // default config 
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      image: 'assets/images/**',
      fonts: 'assets/fonts/**'

    }
  }
}
try {
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({}, config, loadConfig)
} catch (err) {}


const style = () => {
  return src(config.build.paths.styles, {
      base: config.build.src,
      cwd: config.build.src
    }) // base:'src' 可以使目录层级一致
    .pipe(plugins.sass())
    .pipe(dest(config.build.temp))
}

const script = () => {
  return src(config.build.paths.scripts, {
      base: config.build.src,
      cwd: config.build.src
    })
    .pipe(plugins.babel({
      presets: [require('@babel/preset-env')]
    }))
    .pipe(dest(config.build.temp))
}


const page = () => {
  return src(config.build.paths.pages, {
      base: config.build.src,
      cwd: config.build.src
    })
    .pipe(plugins.swig({
      data: config.data
    }))
    .pipe(dest(config.build.temp))
}

const image = () => {
  return src(config.build.paths.image, {
      base: config.build.src,
      cwd: config.build.src
    })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const font = () => {
  return src(config.build.paths.fonts, {
      base: config.build.src,
      cwd: config.build.src
    })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const extra = () => {
  return src('**', {
      base: config.build.public,
      cwd: config.build.public
    })
    .pipe(dest(config.build.dist))
}

const clean = () => {
  return del([config.build.dist])
}

const cleantemp = () => {
  return del([config.build.temp])
}

const serve = () => {
  watch(config.build.paths.styles, {
    cwd: config.build.src
  }, style)
  watch(config.build.paths.scripts, {
    cwd: config.build.src
  }, script)
  watch(config.build.paths.pages, {
    cwd: config.build.src
  }, page)
  // watch('src/assests/images/**', image)
  // watch('src/sassets/fonts/**', font)
  // watch('public/**', extra)
  watch([
    config.build.paths.image,
    config.build.paths.fonts,
  ], {
    cwd: config.build.src
  }, bs.reload)

  watch('**', {
    cwd: config.build.public
  }, bs.reload)

  bs.init({
    server: {
      notify: false, // 关掉一些样式
      port: 3000,
      open: false, // 是否自动打开浏览器
      baseDir: [config.build.temp, config.build.src, config.build.public],
      routes: {
        '/node_modules': 'node_modules'
      },
    }
  })
}

const useref = () => {
  return src(config.build.paths.pages, {
      base: config.build.temp,
      cwd: config.build.temp
    })
    .pipe(plugins.useref({
      searchPath: [config.build.temp, '.']
    }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCss: true,
      minifyJS: true
    })))
    .pipe(dest(config.build.dist))
}

const compile = parallel(style, script, page)

// 上线之前执行的任务
const build = series(clean, parallel(series(compile, useref), image, font, extra))

const develop = series(clean, compile, serve)

module.exports = {
  clean,
  build,
  develop,
  default: develop
}