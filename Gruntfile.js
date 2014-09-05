/*global module:false,require:false*/
module.exports = function (grunt) {
	//TODO augenerer les banners

	"use strict";

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		meta: {
			src_core: 'core/statify-core.js',
			src_adapt_$: 'adapters/statify-$-adapter.js',
			src_adapt_bb: 'adapters/statify-backbone-adapter.js',
			src_adapt_ng: 'adapters/statify-angular-adapter.js',
			jq_lib: ['test/lib/jquery-1.7.2.min.js'],
			bb_lib: ['test/lib/backbone-0.9.1.js'],
			under_lib: ['test/lib/underscore-1.3.1.js'],
			ng_lib: ['test/lib/angular.js']
		},

		jshint: {
			options: {
				"curly": false,
				"eqnull": true,
				"eqeqeq": true,
				"undef": true,
				reporter: require('jshint-stylish')
			},
			"globals": {
				"jQuery": true,
				"Backbone": true,
				"_": true,
				"angular": true
			},
			all: ['src/core/*.js', 'src/adapters/*.js']
		},

		concat: {
			options: {
				stripBanners: true
			},
			ng: {
				src: ['src/<%=meta.src_core%>', 'src/<%=meta.src_adapt_ng%>'],
				dest: 'build/angular/statify-ng.js'
			},
			jquery: {
				src: ['src/<%=meta.src_core%>', 'src/<%=meta.src_adapt_$%>'],
				dest: 'build/jquery/statify-$.js'
			},
			bb: {
				src: ['src/<%=meta.src_core%>', 'src/<%=meta.src_adapt_bb%>'],
				dest: 'build/backbone/statify-backbone.js'
			}

		},
		uglify: {
			all: {
				files: {
					'build/jquery/statify-$.min.js': ['build/jquery/statify-$.js'],
					'build/backbone/statify-backbone.min.js': ['build/backbone/statify-backbone.js'],
					'build/angular/statify-ng.min.js': ['build/angular/statify-ng.js']
				}
			}
		},

		jasmine: {
			jq: {
				src: ['src/<%=meta.src_core%>', 'src/<%=meta.src_adapt_$%>'],
				options: {
					vendor: '<%=meta.jq_lib%>',
					specs: 'test/statify-core-specs.js',
					styles: 'test/statify-specs.css'
				}

			},
			bb: {
				src: ['src/<%=meta.src_core%>', 'src/<%=meta.src_adapt_bb%>'],
				options: {
					vendor: ['<%=meta.jq_lib%>', '<%=meta.under_lib%>', '<%=meta.bb_lib%>'],
					specs: 'test/statify-core-specs.js',
					styles: 'test/statify-specs.css'
				}

			},

			ng: {
				src: ['src/<%=meta.src_core%>', 'src/<%=meta.src_adapt_ng%>'],
				options: {
					vendor: ['<%=meta.ng_lib%>'],
					specs: 'test/statify-core-specs.js',
					styles: 'test/statify-specs.css',
					keepRunner: true
				}

			}
		},


		jsbeautifier: {
			files: ['src/core/*.js', 'src/adapters/*.js']
		},

		clean: ["build"]

	});




	grunt.registerTask('spec', ['jasmine']);
	grunt.registerTask('pack', ['jsbeautifier', 'clean', 'concat', 'uglify']);
	grunt.registerTask('release', ['jsbeautifier', 'jshint', 'jasmine', 'clean', 'concat', 'uglify']);
	grunt.registerTask('format', 'jsbeautifier');
	grunt.registerTask('default', ['jshint', 'jasmine:jq']);
	grunt.registerTask('hint', ['jshint']);
};