/*global module:false,require:false*/
module.exports = function (grunt) {

	"use strict";

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		meta: {
			src_core: 'src/core/statify-core.js',
			src_core_build: 'build/statify-core.js',
			src_adapt_$: 'src/adapters/statify-$-adapter.js',
			src_adapt_bb: 'src/adapters/statify-backbone-adapter.js',
			src_adapt_ng: 'src/adapters/statify-angular-adapter.js',
			jq_lib: ['bower_components/jquery/dist/jquery.js'],
			bb_lib: ['bower_components/backbone/backbone.js'],
			under_lib: ['bower_components/underscore/underscore.js'],
			ng_lib: ['bower_components/angular/angular.js'],
			banner: '//\n' +
				'// <%= pkg.name %> - v<%= pkg.version %>\n' +
				'// The MIT License\n' +
				'// Copyright (c) 2014 Boris Sabadach <boris@washmatique.fr> \n' +
				'//\n'
		},

		"string-replace": {
			version: {
				options: {
					replacements: [{
						pattern: /{{VERSION}}/g,
						replacement: '<%= pkg.version %>'
					}]
				},
				src: '<%=meta.src_core%>',
				dest: '<%=meta.src_core_build%>',
			}
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
			all: ['src/**/*.js']
		},

		concat: {
			ng: {
				options: {
					stripBanners: true,
					banner: '<%= meta.banner %>'
				},
				src: ['<%=meta.src_core_build%>', '<%=meta.src_adapt_ng%>'],
				dest: 'build/angular/statify-ng.js'
			},
			jquery: {
				options: {
					stripBanners: true,
					banner: '<%= meta.banner %>'
				},
				src: ['<%=meta.src_core_build%>', '<%=meta.src_adapt_$%>'],
				dest: 'build/jquery/statify-$.js',

			},
			bb: {
				options: {
					stripBanners: true,
					banner: '<%= meta.banner %>'
				},
				src: ['<%=meta.src_core_build%>', '<%=meta.src_adapt_bb%>'],
				dest: 'build/backbone/statify-backbone.js'
			},


		},
		uglify: {
			options: {
				stripBanners: true,
				banner: '<%= meta.banner %>'
			},
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
				src: ['<%=meta.src_core%>', '<%=meta.src_adapt_$%>'],
				options: {
					vendor: '<%=meta.jq_lib%>',
					specs: ['test/statify-common-specs.js','test/statify-$-specs.js'],
					styles: 'test/statify-specs.css'
					
				}

			},
			bb: {
				src: ['<%=meta.src_core%>', '<%=meta.src_adapt_bb%>'],
				options: {
					vendor: ['<%=meta.jq_lib%>', '<%=meta.under_lib%>', '<%=meta.bb_lib%>'],
					specs: 'test/statify-common-specs.js',
					styles: 'test/statify-specs.css'
				}

			},

			ng: {
				src: ['<%=meta.src_core%>', '<%=meta.src_adapt_ng%>'],
				options: {
					vendor: ['<%=meta.ng_lib%>'],
					specs: 'test/statify-ng-specs.js',
					styles: 'test/statify-specs.css'
				}

			}
		},


		jsbeautifier: {
			files: ['src/**/*.js']
		},

		clean: ["build"]

	});


	grunt.registerTask('release', ['jsbeautifier', 'jshint', 'jasmine', 'clean', 'string-replace', 'concat', 'uglify']);
	grunt.registerTask('default', ['jshint', 'jasmine']);
};