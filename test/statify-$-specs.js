/* global describe,expect,it,spyOn,runs,waitsFor,setTimeout,$ */
(function (root) {

	"use strict";

	var statify = root.statify,
		_ = root._ || statify._,
		$ = root.$ || statify.$,
		arr1, arr2;




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

		it("should not find value ", function () {
			var iterator = function (item) {
				return item === "e";
			};

			expect(_.find(arr1, iterator)).toEqual(void 0);
		});

	});


	describe("_.keys function ", function () {
		beforeEach(function () {
			arr1 = {"one":1,"two":2,"three":3};
		});

		it("should find proper value ", function () {
			expect(_.keys(arr1)).toEqual(["one","two","three"]);

		});

	});
	
	describe("_.difference function ", function () {
		beforeEach(function () {
			arr1 = ["one","two","three","four","one"];
		
		});

		it("should works fine", function () {
			arr2=["one"];
			expect(_.difference(arr1,arr2)).toEqual(["two","three","four"]);
		});
		
		it("should works fine", function () {
			arr2=["one","two"];
			expect(_.difference(arr1,arr2)).toEqual(["three","four"]);
		});
		
		it("should works fine", function () {
			arr2=["0","1"];
			expect(_.difference(arr1,arr2)).toEqual( ["one","two","three","four","one"]);
		});

	});
	
	
	describe("_.indexOf function ", function () {
		beforeEach(function () {
			arr1 = ["one","two","three","four","one"];
		});

		it("should find proper index", function () {
			expect(_.indexOf(arr1,"two")).toEqual(1);

		});
		
		it("should return -1", function () {
			expect(_.indexOf(arr1,"a")).toEqual(-1);

		});

	});

}(this));