module.exports = function (grunt) {

    //Cargo los módulos de grunt automáticamente
    require('load-grunt-tasks')(grunt);

    //Leo el fichero package.json
    var pkg = grunt.file.readJSON('package.json');

    // Configuration
    var config = {
        app: 'src/main',
        test: 'src/test/unit',
        target: 'target',
        targetDist: 'target/' + pkg.version,
        targetTest: 'target/test-results'
    };

    // Project configuration.
    grunt.initConfig({
        config: config,

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            js: {
                files: [
                    '<%= config.app %>/**/*.js',
                    '<%= config.test %>/**/*.js'
                ],
                tasks: ['mochaTest'],
                options: {
                    livereload: true
                }
            }
        },

        nodemon: {
            dev: {
                script: 'app.js',
                options: {
                    args: ['dev'],
                    nodeArgs: ['--debug'],
                    callback: function (nodemon) {
                        nodemon.on('log', function (event) {
                            console.log(event.colour);
                        });
                    },
                    cwd: '<%= config.app %>',
                    ignore: ['node_modules/**'],
                    ext: 'js',
                    watch: ['.'],
                    delay: 1000
                    //legacyWatch: true
                }
            }
        },

        mochaTest: {
            dev: {
                options: {
                    reporter: 'nyan',
                    //captureFile: 'results.txt',
                    quiet: false,
                    clearRequireCache: true
                },
                src: ['<%= config.test %>/**/*.js']
            },
            maven: {
                options: {
                    reporter: 'xunit',
                    captureFile: '<%= config.targetTest %>/unit-tests-results.xml',
                    quiet: true,
                    clearRequireCache: true
                },
                src: ['<%= config.test %>/**/*.js']
            }
        },

        mocha_istanbul: {
            coverage: {
                src: '<%= config.test %>', // a folder works nicely
                options: {
                    reporter: 'progress',
                    reportFormats: ['cobertura', 'lcov'],
                    coverageFolder: '<%= config.targetTest %>/coverage',
                    clearRequireCache: true
                }
            }
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc',
                ignores: [''],
                reporter: require('jshint-smart'),
                verbose: false
            },
            all: {
                files: {
                    src: ['<%= config.app %>/**/*.js']
                }
            }
        },
        jscs: {
            options: {
                config: '.jscsrc',
                excludeFiles: [''],
                reporter: require('jscs-stylish').path
            },
            all: {
                files: {
                    src: ['<%= config.app %>/**/*.js']
                }
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= config.target %>/**/*',
                        '!<%= config.target %>/test-results',
                        '!<%= config.target %>/test-results/**/*'
                    ]
                }]
            },
            server: '.tmp',
            end: ['<%= config.target %>/archive-tmp', '.tmp'],
            test: ['<%= config.target %>/test-results']
        },

        // Copy files
        copy: {
            dist: {
                files: [
                    {
                        expand: true, cwd: '<%= config.app %>/',
                        src: ['**/*'], dest: '<%= config.targetDist %>/src/main/'
                    },
                    {
                        src: ['package.json'], dest: '<%= config.targetDist %>/'
                    }
                ]
            }
        },

        // Concurrent tasks
        concurrent: {
            dev: {
                tasks: ['nodemon:dev', 'watch'],
                options: {logConcurrentOutput: true}
            }
        }
    });


    //********************* ALIAS ***************************

    // Starts a development server for nodejs app
    grunt.registerTask('dev', [
        'clean:server',
        'concurrent:dev'
    ]);

    // Test runner
    grunt.registerTask('test', [
        'mochaTest:dev'
    ]);

    // Test runner with coverage
    grunt.registerTask('test-coverage', [
        'clean:test',
        'mochaTest:maven',
        'mocha_istanbul:coverage'
    ]);

    // JShint + JSCS runner
    grunt.registerTask('sonar', '', function () {
        // Use the force option for all tasks declared in the previous line
        grunt.option('force', true);
        grunt.task.run([
            'jshint:all',
            'jscs:all'
        ]);
    });

    // simple build task
    grunt.registerTask('build', [
        'clean:dist',
        'copy:dist',
        'clean:end'
    ]);


    // Package the dist.
    grunt.registerTask('default', [
        'build'
    ]);
};
