/* global describe,expect,it,spyOn,runs,waitsFor,setTimeout,$ */
(function (root) {

	"use strict";

	var statify = root.statify,
		_ = root._ || statify._,
		$ = root.$ || statify.$,
		angular = root.angular,
		controllerScope, directiveScope, rootScope, ngElement;






	var node = "<div id='container-test' ng-controller='TestController' class='container' data-states='one,two,three' >" +
		"<div id='item1' class='item1' data-states-inc='one,two,three'></div>" +
		"<div id='item2' class='item2' data-states-inc='one,two'><button id='selector'  ng-click='setState(\"two\")'></button></div>" +
		"<div id='item3' class='item3' data-states-exc='one'></div>" +
		"</div>";




	//---------------------------------------
	//	TESTS
	//----------------------------------------
	describe("TestController", function () {

		beforeEach(function () {
			boostrapModule();
		});

		it("should have a setState method", function () {
			expect(angular.isFunction(controllerScope.setState)).toBeTruthy();
		});

		afterEach(function () {
			releaseModule();
		})

	});

	describe("The data-states-exc directive", function () {

		beforeEach(function () {
			boostrapModule();
		});

		it("scope should have on option object", function () {
			expect(angular.isObject(directiveScope.options)).toBeTruthy();
		});

		it("scope should have a stateManager object", function () {
			expect(angular.isObject(directiveScope.stateManager)).toBeTruthy();
		});


		it("scope should have a initializeState function", function () {
			expect(angular.isFunction(directiveScope.initializeStates)).toBeTruthy();
		});

		it("scope should have a onStateEvent function", function () {
			expect(angular.isFunction(directiveScope.onStateEvent)).toBeTruthy();
		});

		it("scope should have a dispose states function", function () {
			expect(angular.isFunction(directiveScope.disposeStates)).toBeTruthy();
		});




		afterEach(function () {
			releaseModule();
		})

	});



	describe("The stateClient options", function () {

		beforeEach(function () {
			boostrapModule();

		});

		it("should declare 3 elements", function () {
			expect(directiveScope.options.elements.length).toEqual(3);
		});


		afterEach(function () {
			releaseModule();
		})

	});



	describe("The stateManager", function () {

		beforeEach(function () {
			boostrapModule();

		});

		it("should hold states one,two,three", function () {
			expect(statify._.keys(directiveScope.stateManager.states).length).toEqual(3);
			expect(statify._.keys(directiveScope.stateManager.states)).toEqual(['one', 'two', 'three']);
		});


		afterEach(function () {
			releaseModule();
		})

	});




	describe("The directiveScope", function () {

		beforeEach(function (done) {
			boostrapModule();
			spyOn(directiveScope, '$emit');
			setTimeout(function () {
				done();
			}, 1000);
		});

		it("scope should have emitted an state:cghaned event", function (done) {
			expect(directiveScope.$emit).toHaveBeenCalledWith('state:changed', 'one');
			done();
		});


		afterEach(function () {
			releaseModule();
		})

	});

	describe("invoking setState on the controller scope", function () {

		beforeEach(function (done) {
			boostrapModule();
			spyOn(directiveScope, '$emit');
			setTimeout(function () {
				controllerScope.setState("two");
				setTimeout(function () {
					done();
				}, 2000);
			}, 2000);
		});

		it("should trigger states lifecycle events on directive scope", function (done) {
			expect(directiveScope.$emit).toHaveBeenCalledWith('state:exit', 'one');
			expect(directiveScope.$emit).toHaveBeenCalledWith('state:exited', 'one');
			expect(directiveScope.$emit).toHaveBeenCalledWith('state:enter', 'two');
			expect(directiveScope.$emit).toHaveBeenCalledWith('state:changed', 'two');
			done();
		});


		afterEach(function () {
			releaseModule();
		})

	});


	//---------------------------------------
	//	UITILITY FUNCTIONS TESTS
	//----------------------------------------

	var arr1, arr2;

	describe("_.find function ", function () {
		beforeEach(function () {
			arr1 = ["a", "b", "c", "d", "c"];
		});

		it("should find proper value ", function () {
			var iterator = function (item) {
				return item === "c";
			};

			expect(_.find(arr1, iterator)).toEqual("c");

		});

		it("should return undefined if not find value ", function () {
			var iterator = function (item) {
				return item === "e";
			};

			expect(_.find(arr1, iterator)).toEqual(void 0);
		});

	});


	describe("_.keys function ", function () {
		var o1;
		beforeEach(function () {
			o1 = {
				"one": 1,
				"two": 2,
				"three": 3
			};
		});

		it("should object keys ", function () {
			expect(_.keys(o1)).toEqual(["one", "two", "three"]);

		});
		
		it("should return empty array ", function () {
			expect(_.keys({})).toEqual([]);

		});

	});

	describe("_.difference function ", function () {
		beforeEach(function () {
			arr1 = ["one", "two", "three", "four", "one"];

		});

		it("should return the right mono value array", function () {
			arr2 = ["one"];
			expect(_.difference(arr1, arr2)).toEqual(["two", "three", "four"]);
		});

		it("should return the right multi value array", function () {
			arr2 = ["one", "two"];
			expect(_.difference(arr1, arr2)).toEqual(["three", "four"]);
		});

		it("should return original array if arrays are completly different", function () {
			arr2 = ["0", "1"];
			expect(_.difference(arr1, arr2)).toEqual(["one", "two", "three", "four", "one"]);
		});

	});


	describe("_.indexOf function ", function () {
		beforeEach(function () {
			arr1 = ["one", "two", "three", "four", "one"];
		});

		it("should find proper index", function () {
			expect(_.indexOf(arr1, "two")).toEqual(1);

		});

		it("should return -1", function () {
			expect(_.indexOf(arr1, "a")).toEqual(-1);

		});

	});



	function boostrapModule() {

		angular.module('statify-ng-test', ['statify-ng'])
			.controller("TestController", ['$scope', '$rootScope',
				function ($scope, $rootScope) {
					controllerScope = $scope;
					rootScope = $rootScope;
			}]);

		ngElement = angular.element(node);
		angular.bootstrap(ngElement, ['statify-ng-test']);
		directiveScope = ngElement.isolateScope();
	};


	function releaseModule() {
		rootScope.$destroy();
	}

}(this));