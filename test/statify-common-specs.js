/* global describe,expect,it,spyOn,runs,waitsFor,setTimeout,$ */
(function (root) {

	"use strict";

	var statify = root.statify,
		_ = root._ || statify._,
		$ = root.$ || statify.$,
		CSSStyleDeclaration = root.CSSStyleDeclaration;



	var createMockHtmlNode = function () {
		var node = "<div id='container-test' class='container' data-states='one,two,three'>" +
			"<div id='item1' class='item1' data-states-inc='one,two,three'></div>" +
			"<div id='item2' class='item2' data-states-inc='one,two'></div>" +
			"<div id='item3' class='item3' data-states-exc='one'><div id='item31' class='square3' data-states-inc='one'></div></div>" +
			"</div>";
		return node;
	};


	describe("CSS style sheet introspection tests", function () {
		var CSS = statify.CSS;

		it("should find the css rules present in the stylesheet", function () {
			var selector = ".item1-one",
				expectedStyle;
			expectedStyle = CSS.findStyle(selector);
			expect(expectedStyle).not.toEqual("undefined");

			selector = ".item1--one";
			expectedStyle = CSS.findStyle(selector);
			expect(expectedStyle).not.toEqual("undefined");

			selector = ".item2-two";
			expectedStyle = CSS.findStyle(selector);
			expect(expectedStyle).not.toEqual("undefined");
		});

		it("CSS.findStyle should return a CSSStyleDeclaration object type", function () {
			var selector = ".item1-one",
				expectedStyle;
			expectedStyle = CSS.findStyle(selector);
			expect(expectedStyle instanceof CSSStyleDeclaration).toBeTruthy();
		});

		it("should return the string 'undefined' if the css class is not found", function () {
			var style = ".item99-one",
				found;
			found = CSS.findStyle(style);
			expect(found).toEqual("empty");

		});


	});


	describe("ViewStateElement visibility tests", function () {

		var $el = $(createMockHtmlNode()).find("#item1");
		var stateElement = new statify.ViewStateElement($el, false);

		it("after toggle called first time, visible element should be considered as not displayed", function () {
			stateElement.toggle();
			expect(stateElement.$el.css(stateElement.display.type)).toBe(stateElement.display.no);
		});

		it("after toggle called another time,view state element should be considered as displayed", function () {
			stateElement.toggle();
			expect(stateElement.$el.css(stateElement.display.type)).toBe(stateElement.display.yes);
		});

	});


	describe("ViewStateElement style swapping", function () {

		var $el = $(createMockHtmlNode()).find("#item1");
		var stateElement = new statify.ViewStateElement($el, true);

		it("should have the right style when state style applied with default css modifier", function () {
			stateElement.addStateStyle("one");
			expect(stateElement.$el.hasClass("item1-one")).toBeTruthy();
			stateElement.removeStateStyle("one");
		});

		it("should not apply style that doesn't exist in any style sheet", function () {
			stateElement.addStateStyle("no-exist");
			expect(stateElement.$el.hasClass("no-exist")).toBeFalsy();
		});

		it("should have the right style when css  name modifier was changed in config", function () {
			statify.config.cssModifier = "--";
			stateElement = new statify.ViewStateElement($el, true);
			stateElement.addStateStyle("one");
			expect(stateElement.$el.hasClass("item1--one")).toBeTruthy();
			stateElement.removeStateStyle("one");

			statify.config.cssModifier = "-";
		});


	});


	describe("StatesContext object building tests from DOM", function () {

		var buildStatesContext = statify.buildStatesContext;

		var $el = $(createMockHtmlNode()),
			statesContext;


		statesContext = buildStatesContext($el, {
			keepLayout: true,
			deepFetch: false,
			includeRoot: false,
			initialState: "two",
			reverseTransitions: false,
			silent: false
		});


		it("should build states names correctly", function () {
			expect(statesContext).not.toBe(null);
			expect(statesContext.names).toEqual("one,two,three");
		});


		it("each context property should be initialized with the value declared in options", function () {
			expect(statesContext.keepLayout).toBeTruthy();
			expect(statesContext.deepFetch).toBeFalsy();
			expect(statesContext.reverseTransitions).toBeFalsy();
			expect(statesContext.silent).toBeFalsy();
			expect(statesContext.initialState).toEqual("two");
		});

		it("the statesContext container property should be $el ", function () {
			expect(statesContext.container).toEqual($el);
		});

		it("should find 3 elements in stateContext", function () {
			expect(statesContext.elements.length).toEqual(3);
		});

		it("should find 4 elements in stateContext if deepFetch if set to true", function () {
			statesContext = buildStatesContext($el, {
				deepFetch: true
			});
			expect(statesContext.elements.length).toEqual(4);
		});

		it("each context options property should be initialized with the right default value when not declared in options", function () {
			statesContext = buildStatesContext($el, {});
			expect(statesContext.keepLayout).toBeTruthy();
			expect(statesContext.deepFetch).toBeFalsy();
			expect(statesContext.initialState).toEqual("one");

			expect(statesContext.reverseTransitions).toBeFalsy();
			expect(statesContext.silent).toBeFalsy();

		});

	});


	describe("StatesContext object builder tests from options", function () {

		var buildStatesContext = statify.buildStatesContext;

		var $el = $(createMockHtmlNode()),
			statesContext = buildStatesContext($el, {
				names: "one,two,three",
				elements: [
					{
						$el: ".item1",
						inc: "one,two,three"
					},
					{
						$el: ".item2",
						inc: "one,two"
					},
					{
						$el: ".item3",
						exc: "one"
					}
                ]
			});

		it("should find states names", function () {
			expect(statesContext).not.toBe(null);
			expect(statesContext.names).toEqual("one,two,three");
		});

		it("the statesContext container property should be $el object ", function () {
			expect(statesContext.container).toEqual($el);
		});


		it("keepLayout should be true by default", function () {
			expect(statesContext.keepLayout).toBeTruthy();
		});


		it("should find 3 targets in stateContext", function () {
			expect(statesContext.elements.length).toEqual(3);
		});

	});


	describe("ViewStates behaviours tests", function () {

		var $el = $(createMockHtmlNode()),
			statesContext = statify.buildStatesContext($el, {});
		var states = statify.buildViewStates(statesContext);

		var stateOne = states.one;
		stateOne.enter();

		it("excluded elements should not visible after entered state", function () {
			var element;
			for (var i = 0, len = stateOne.exclusions; i < len; i++) {
				element = stateOne.exclusions[i];
				expect(element.isDisplayed()).toBe(false);
			}

		});

		it("included elements should be visible after entered state", function () {
			for (var i = 0, el, len = stateOne.inclusions.length; i < len; i++) {
				el = stateOne.inclusions[i];
				expect(el.isDisplayed()).toBe(true);
			}
		});


	});

	describe("view states builder tests", function () {
		var $el = $(createMockHtmlNode()),
			statesContext = statify.buildStatesContext($el, {
				includeRoot: true
			});
		var states = statify.buildViewStates(statesContext);
		var aState, found, timesFound = 0;

		it("should find the $el object in every ViewState when includeRoot is set to true", function () {
			_.each(_.keys(states), function (key) {
				aState = states[key];
				found = _.find(aState.inclusions, function (viewState) {
					return viewState.$el === $el;
				});
				if (found) timesFound++;
			});
			expect(timesFound).toEqual(_.keys(states).length);
		});


	});


}(this));


/* global describe,expect,it,spyOn,runs,waitsFor,setTimeout */
(function (root) {

	"use strict";

	var statify = root.statify,
		_ = root._ || statify._,
		$ = root.$,
		CSS = statify.CSS;


	describe("CSS transitions duration computing", function () {
		it("CSS.getTransDuration should return the proper total value of transition duration", function () {
			var style = ".item1-one",
				duration;
			duration = CSS.getFullDuration(style);
			expect(duration).toBe(1000);

			style = ".item2-two";
			duration = CSS.getFullDuration(style);
			expect(duration).toBe(1500);

			style = ".two-properties-transitions";
			duration = CSS.getFullDuration(style);
			expect(duration).toBe(3000);
		});
	});


	describe("ViewStateTransitions test:", function () {
		var node = "<div id='container-test' class='container' data-states='one,two,three'>" +
			"<div id='item1' class='item1' data-states-inc='all'></div></div>";

		var $el = $(node),
			statesContext = statify.buildStatesContext($el, {}),
			states = statify.buildViewStates(statesContext),
			state = states.one;

		var mockCallBack = function () {};

		var transition = new statify.ViewStateTransition();
		transition.callBack = mockCallBack;



		beforeEach(function (done) {
			spyOn(transition, 'callBack');
			transition.playOn(state);
			setTimeout(function () {
				done();
			}, 1000);

		});


		it("callback should be called at the end of transition", function (done) {
			expect(transition.callBack).toHaveBeenCalled();
			done();
		});


	});



	describe("ViewStatesManager tests on a state container ", function () {

		var mockStatesContainer = "<div id='container-test' data-states='one,two,three'>" +
			"<div id='item1' class='test1' data-states-inc='one'></div>" +
			"<div id='item2' class='test2' data-states-inc='two'></div>" +
			"<div id='item3' class='test3' data-states-exc='three'></div>" +
			"</div>";


		var $el = $(mockStatesContainer);
		var mockClient = {
			$el: $el,
			trigger: function (event, stateName) {
				this.$el.trigger(event, stateName);
			}

		};

		var statesContext = statify.buildStatesContext($el, {});
		var states = statify.buildViewStates(statesContext);


		var statesManager = new statify.ViewStatesManager({
			client: mockClient,
			states: states
		}, {});


		it("should throw error when setting unknown state", function () {
			try {
				statesManager.setState("no-exist");
			} catch (e) {
				expect(e.message).toEqual("unknown state:-no-exist-");
			}

		});

		it("Should trigger states life cycle events if not silent", function () {
			statesManager.silent = false;
			statesManager.setState("one");
			spyOn(mockClient, 'trigger');
			statesManager.setState("two");


			expect(mockClient.trigger).toHaveBeenCalledWith(statify.EXIT, "one");
			expect(mockClient.trigger).toHaveBeenCalledWith(statify.EXITED, "one");
			expect(mockClient.trigger).toHaveBeenCalledWith(statify.ENTER, "two");
			expect(mockClient.trigger).toHaveBeenCalledWith(statify.CHANGED, "two");

			statesManager.setState("three");

			expect(mockClient.trigger).toHaveBeenCalledWith(statify.EXIT, "two");
			expect(mockClient.trigger).toHaveBeenCalledWith(statify.EXITED, "two");
			expect(mockClient.trigger).toHaveBeenCalledWith(statify.ENTER, "three");
			expect(mockClient.trigger).toHaveBeenCalledWith(statify.CHANGED, "three");

		});

		it("Should not trigger states life cycle events if silent", function () {
			statesManager.silent = true;
			statesManager.setState("one");
			spyOn(mockClient, 'trigger');

			statesManager.setState("two");
			expect(mockClient.trigger).not.toHaveBeenCalledWith(statify.EXIT, statify.EXIT, "one");
			expect(mockClient.trigger).not.toHaveBeenCalledWith(statify.ENTER, statify.ENTER, "two");

		});

	});


	describe("ViewStatesManager tests with css transitions", function () {

		var node = "<div id='container-test' class='container' data-states='one,two,three'>" +
			"<div id='item1' class='item1' data-states-inc='all'></div></div>",
			$el = $(node),
			mockClient = {
				$el: $el,
				trigger: function (event, stateName) {
					this.$el.trigger(event, stateName);
				}
			};


		var statesContext = statify.buildStatesContext($el, {});
		var states = statify.buildViewStates(statesContext);


		var statesManager = new statify.ViewStatesManager({
			client: mockClient,
			states: states
		}, {
			reverseTransitions: false
		});

		statesManager.silent = false;


		describe("", function (done) {


			beforeEach(function (done) {
				spyOn(mockClient, 'trigger');
				statesManager.setState("one");
				setTimeout(function () {
					done();
				}, 1000);

			});


			it("client should have triggered ENTER and CHANGED state lifecycle events after transitions end when setting initial state", function (done) {
				expect(mockClient.trigger).toHaveBeenCalledWith(statify.ENTER, "one");
				expect(mockClient.trigger).toHaveBeenCalledWith(statify.CHANGED, "one");
				done();

			});

		});


		describe("", function (done) {

			var originalTimeout;

			beforeEach(function (done) {
				originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
				jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
				spyOn(mockClient, 'trigger');
				statesManager.setState("three");

				setTimeout(function () {
					done();
				}, 4000);
			});


			it("client should have triggered all state lifecycle events after transitions end when changing state", function (done) {
				expect(mockClient.trigger).toHaveBeenCalledWith(statify.EXIT, "one");
				expect(mockClient.trigger).toHaveBeenCalledWith(statify.EXITED, "one");
				expect(mockClient.trigger).toHaveBeenCalledWith(statify.ENTER, "three");
				expect(mockClient.trigger).toHaveBeenCalledWith(statify.CHANGED, "three");
				done();
			});

			afterEach(function () {
				jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
			});

		});

	});


}(this));