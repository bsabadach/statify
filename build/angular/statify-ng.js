var statify = (function(root) {

    "use strict";

    var document = root.document,
        console = root.console,
        CSSStyleRule = root.CSSStyleRule,
        CSSRule = root.CSSRule,
        setTimeout = root.setTimeout,
        _core = {};


    //-------------------------------------
    // configuration
    //-------------------------------------

    _core.VERSION = "0.1.0";


    _core.ns = "washm.statify";


    _core.config = {
        stateAttr: "data-states",
        inAttr: "data-states-inc",
        outAttr: "data-states-exc",
        cssModifier: "-",
        triggerFunction: "trigger"
    };


    //-------------------------------------
    // utilities
    //-------------------------------------


    // turn off debug by default
    _core.DEBUG = true;


    // debug function
    _core._debug = (function() {
        var join = [].join,
            canLog = console && console.log;
        return function() {
            return canLog && _core.DEBUG && console.log(join.call(arguments, ','));
        };
    }());

    var _notImplemented = function(name) {
        return function() {
            _core._debug(name + "  is not implemented");
        };
    };

    // define util functions used in the project
    var utilMethods = ["isFunction", "isArray", "find", "indexOf", "each", "difference", "keys", "isObject", "extend", "bind"];

    _core._ = {};

    // add them do _ variable and mark them as not implemented
    for (var i in utilMethods) {
        _core._[utilMethods[i]] = _notImplemented(utilMethods[i]);
    }

    // turn off debug by default
    _core.DEBUG = true;


    /**
     * add the trim function to String object if not implemented
     * @type {*}
     */
    if (typeof String.prototype.trim !== "function") {
        String.prototype.trim = _core._.trim || _core.$.trim;
    }


    /**
     * CSS utilities
     * @type {*}
     */
    _core.CSS = (function(document, core) {
        var _hasSheets = true,
            _stylesCache = {},
            _acceptedMediaTypes = ["screen", "all", ""],
            _durationsCache = {};

        return {
            transitions: (function() {
                var el = document.createElement('div'),
                    transProps = ['transition', 'OTransition', 'MSTransition', 'MozTransition', 'WebkitTransition'],
                    props = el.style,
                    prop;

                for (var i in transProps) {
                    if (props[transProps[i]] !== void 0) {
                        prop = transProps[i];
                        break;
                    }
                }

                return prop !== void 0 && {
                    durationProp: prop + "Duration",
                    delayProp: prop + "Delay"
                };
            }()),

            /**
             * return true if the comma separated string list of media types declared on a sheet and passed as parameter
             * should be accepted for further process
             */
            _acceptSheet: function(sheet) {
                var _ = core._;
                var mediaTypes = sheet.media.mediaText;
                mediaTypes = mediaTypes.split(",");
                return _.find(mediaTypes, function(mediaType) {
                    return _.indexOf(_acceptedMediaTypes, mediaType.trim()) >= 0;
                }) !== void 0;
            },

            /**
             *  returns true if in the rule passed as parameter matches
             *  the selectorText passed as parameter.
             */
            _ruleHasSelector: function(rule, selectorText) {
                var _ = core._,
                    selectors = rule.selectorText.split(",");
                return !!_.find(selectors, function(aSelectorText) {
                    return aSelectorText.trim() === selectorText;
                });
            },

            /**
             * return the Style object found among rules list passed as parameter which selectorText contains
             * the selector string passed a parameter.
             */
            _findStyleInRules: function(rules, selector) {
                var self = this,
                    _ = core._;
                var rule = _.find(rules, function(rule) {
                    //in Opera rule.constructor returns the interface name and not the implementation
                    return (rule.constructor === CSSStyleRule || rule.constructor === CSSRule) && self._ruleHasSelector(rule, selector);
                });
                return rule === void 0 ? null : rule.style;
            },


            /**
             * returns the Style Object and caches it if a CSS rule was found among all
             * declared style sheets in the document. Sheets loaded from a different domain are excluded
             */
            findStyle: function(selector) {
                if (_hasSheets && _stylesCache[selector] !== void 0) return _stylesCache[selector];
                var sheets = document.styleSheets;
                _hasSheets = sheets === void 0;
                if (_hasSheets) return null;
                var sheet,
                    rules,
                    styleRule;
                for (var i = 0, l = sheets.length; i < l; i++) {
                    try {
                        sheet = sheets[i];
                        if (!sheet || !this._acceptSheet(sheet)) continue; // exclude all media type except screen
                        rules = sheet.rules || sheet.cssRules;
                        if (rules === null) continue;
                        styleRule = this._findStyleInRules(rules, selector);
                        if (styleRule !== null) {
                            _stylesCache[selector] = styleRule;
                            return styleRule;
                        }
                    } catch (e) {
                        console.log(e.message);
                        if (e.name === 'SecurityError') continue;
                        else throw e;
                    }
                }
                _stylesCache[selector] = "empty";
                return _stylesCache[selector];
            },


            /**
             * returns true if a CSS rule corresponding to the selector rule was found among
             * the matching style sheets
             */
            hasRule: function(selector) {
                return this.findStyle(selector) !== "empty";
            },


            /**
             * return the maximum number in milliseconds of a comma separated expression of CSS durations declarations
             * for instance '1s,2s' returns 2000.
             */
            getMillis: function(expression) {
                var tokens = expression.split(","),
                    millis = 0,
                    t, _ = core._;
                _.each(tokens, function(token) {
                    t = parseFloat(token.replace("s", "").replace("m", ""));
                    millis = Math.max(millis, isNaN(t) ? 0 : t * (token.indexOf("ms") === -1 ? 1000 : 1));
                });
                return millis;
            },

            /**
             * return the total duration including delay of all the CC3 transitions in a CCS rule having the selector passed as parameter
             */
            getFullDuration: function(selector) {
                if (!this.transitions) return 0;
                var that = this;
                return _durationsCache[selector] || (function() {
                    if (!that.hasRule(selector)) {
                        _durationsCache[selector] = 0;
                        return 0;
                    }
                    var style = that.findStyle(selector);
                    var duration = that.getMillis(style[that.transitions.durationProp]) + that.getMillis(style[that.transitions.delayProp]);
                    _durationsCache[selector] = duration;
                    return duration;
                })();

            }
        };

    }(document, _core));


    //-------------------------------------
    // state machine implementation
    //-------------------------------------


    _core.EXIT = "state:exit";
    _core.EXITED = "state:exited";
    _core.ENTER = "state:enter";
    _core.CHANGED = "state:changed";


    /**
     * The ViewStateElement object wraps a DOM element (queried by the DOM selector library) that has a role in a view state.
     * The class provides methods to manage the element visibility and style when view state changes.
     * @type {*}
     */
    (function(core) {

        var _CSS = core.CSS;
        var _config = core.config;

        var _displayPolicies = [{
                type: "display",
                yes: "block",
                no: "none"
            }, {
                type: "visibility",
                yes: "visible",
                no: "hidden"
            }

        ];

        var ViewStateElement = function($el, keepLayout) {
            this.$el = $el;
            this.display = _displayPolicies[keepLayout ? 1 : 0];
            if (!keepLayout) {
                var originalDisplay = $el.css(this.display.yes);
                if (originalDisplay) this.display.yes = originalDisplay; //!!!!!!!!!!!!!!!
            }

            this.ensure();
        };

        ViewStateElement.prototype = {
            ensure: function() {
                if (this.$el.attr("class") === void 0) throw new Error(this.$el.selector + " element(s) must have at least a base style class");
                this.baseStyle = this.$el.attr("class").split(" ").pop();
            },

            isDisplayed: function() {
                // its' simpler to compare to the not displayed css value because in the case of display block/none
                // the initial display value of the element could not be "block"  but "inline-block" or else
                return this.$el.css(this.display.type) !== this.display.no;
            },

            toggle: function() {
                this.$el.css(this.display.type, this.isDisplayed() ? this.display.no : this.display.yes);
            },

            removeStateStyle: function(state) {
                var style = this.baseStyle + _config.cssModifier + state;
                if (style && this.$el.hasClass(style)) this.$el.removeClass(style);
            },

            addStateStyle: function(state) {
                var selector = this.getStyleSelector(state);
                if (_CSS.hasRule(selector)) this.$el.addClass(selector.replace(".", ""));
            },

            getStyleSelector: function(state) {
                return "." + this.baseStyle + _config.cssModifier + state;
            }

        };
        core.ViewStateElement = ViewStateElement;

    }(_core));


    /**
     *  The ViewState class encapsulate all the properties that define the state of a DOM element.
     * - it references arrays of child DOM elements (state targets) that are included or excluded from the state
     * - the class provide an 'enter' and an 'exit' method that manages the ViewState lifecycle during states transitions
     * @type {*}
     */
    (function(core) {

        var ViewStateElement = core.ViewStateElement;

        /**
         * @param name : the state name
         * @param $el : the DOM element targeted as a state container
         * @param keepLayout: the display policy for state targets.
         * @constructor
         */
        var ViewState = function(name, $el, keepLayout) {
            this.$el = $el;
            this.name = name;
            this.keepLayout = keepLayout;
            this.transDuration = -1;
            this.inclusions = [];
            this.exclusions = [];
        };


        ViewState.prototype = {

            addElement: function($el, isIncluded) {
                (isIncluded ? this.inclusions : this.exclusions).push(new ViewStateElement($el, this.keepLayout));
            },

            /**
             * the exit function removes all the state style class on each included target
             */
            exit: function() {
                var _ = core._;
                _.each(this.inclusions, function(viewStateEl) {
                    viewStateEl.removeStateStyle(this.name);
                }, this);
            },

            /**
             * the enter function hides all exclusions and shows all inclusions
             */
            enter: function() {
                var _ = core._;
                _.each(this.exclusions, function(viewStateEl) {
                    this._update(viewStateEl, false);
                }, this);
                _.each(this.inclusions, function(viewStateEl) {
                    this._update(viewStateEl, true);
                }, this);
            },

            /**
             * update the visibility of a the state element and applies the state style class if the element has to be visible
             * @param element
             * @param mustDisplay
             * @private
             */
            _update: function(target, mustDisplay) {
                if (mustDisplay !== target.isDisplayed()) target.toggle();
                if (mustDisplay) target.addStateStyle(this.name);
            }

        };

        core.ViewState = ViewState;

    }(_core));


    /**
     * the ViewStatesManager is the delegate of a states client that needs to manage its states
     */
    (function(core) {


        var ViewStatesManager = function(attributes, options) {
            this.client = attributes.client;
            this.states = attributes.states;
            this.initialize(options);
        };

        ViewStatesManager.prototype = {

            initialize: function(options) {
                this.silent = options.silent;
                this.nextState = this.currentState = null;
            },

            notifyClient: function(event, stateName) {
                if (!this.silent) this.client.trigger(event, stateName);
            },

            setState: function(name) {
                this.ensureState(name);
                this.nextState = this.states[name];
                this.exitCurrent();
                this.enterNext();
            },

            ensureState: function(name) {
                if (this.states[name] === void 0) throw new Error("unknown state:-" + name + "-");
            },

            exitCurrent: function() {
                if (!this.currentState) return;
                if (this.nextState === this.currentState.name) return;
                this.currentState.exit();
            },

            enterNext: function() {
                this.nextState.enter();
                this.currentState = this.nextState;
                this.afterNextEntered();
            },
            afterNextEntered: function() {
                this.nextState = null;
                this.client.currentState = this.currentState;
                this.notifyClient(core.CHANGED, this.currentState.name);
            }
        };
        core.ViewStatesManager = ViewStatesManager;


    }(_core));

    /**
     * par of code that is executed only if the browser supports CSS3 transitions
     */
    (function(core) {

        var CSS = core.CSS;
        if (!CSS.transitions) return;

        /**
         * The ViewStateTransition triggers the CSS3 transitions on a view state when a style containing transitions is applied
         * It waits for the transitions to be completed to invoke a callback method.
         * The listening strategy is based on full transition duration and not on 'transitionEnd' event handling.
         * @type {*}
         */
        var ViewStateTransition = function() {
            this.initialize();
        };


        ViewStateTransition.prototype = {
            _startOn: function(state, reverseIt) {
                this.isPlaying = true;
                var duration = this._getTotalDuration(state);
                this._start(state, duration, this.onComplete, reverseIt);
            },

            _onComplete: function() {
                this.callBack();
                this.isPlaying = false;
            },
            _start: function(state, time, callBack, reverseIt) {
                if (reverseIt) state.exit();
                else state.enter();
                if (time === 0) {
                    callBack();
                    return;
                }
                setTimeout(callBack, time);
            },

            _getTotalDuration: function(state) {
                if (state.transDuration >= 0) return state.transDuration;
                var t = 0,
                    _ = core._;
                _.each(state.inclusions, function(el) {
                    t = Math.max(CSS.getFullDuration(el.getStyleSelector(state.name)), t);
                });
                state.transDuration = t;
                return t;
            },


            initialize: function() {
                var _ = core._;
                this.isPlaying = false;
                this.callBack = null;
                this.onComplete = _.bind(this._onComplete, this);
            },


            playOn: function(state) {
                this._startOn(state, false);
            },

            reverseOn: function(state) {
                this._startOn(state, true);
            }

        };

        _core.ViewStateTransition = ViewStateTransition;

        /**
         * some ViewStatesManager function are over-written  if browser supports transitions
         * - listens to CSS3 transitions on state change
         * - triggers full state lifecycle events
         */

        var _ = core._;
        var extend = function(source, destination) {
            for (var prop in source) {
                if (source.hasOwnProperty(prop)) {
                    destination[prop] = source[prop];
                }
            }
        }

        extend(core.ViewStatesManager.prototype, {

            initialize: function(options) {
                this.reverseTransitions = options.reverseTransitions;
                this.transition = new ViewStateTransition();
                this.onCurrentExited = _.bind(this.enterNext, this);
                this.completeCallBack = _.bind(this.afterNextEntered, this);
            },

            setState: function(name) {
                if (this.transition.isPlaying) return;
                this.ensureState(name);
                this.nextState = this.states[name];
                if (this.nextState === this.currentState) return;
                this.exitCurrent();
            },

            exitCurrent: function() {
                if (!this.currentState) {
                    this.enterNext();
                    return;
                }
                this.notifyClient(core.EXIT, this.currentState.name);
                if (this.reverseTransitions) {
                    this.transition.callBack = this.onCurrentExited;
                    this.transition.reverseOn(this.currentState);
                } else {
                    this.currentState.exit();
                    this.enterNext();
                }

            },

            enterNext: function() {
                if (this.currentState) {
                    this.notifyClient(core.EXITED, this.currentState.name);
                }
                this.notifyClient(core.ENTER, this.nextState.name);
                this.transition.callBack = this.completeCallBack;
                this.transition.playOn(this.nextState);
            },

            afterNextEntered: function() {
                this.currentState = this.nextState;
                this.notifyClient(core.CHANGED, this.currentState.name);
            }

        });

    }(_core));


    /**
     * States builder function: search for all state targets (child elements) in a DOM element to build its view states.
     * @type {*}
     */
    _core.buildViewStates = (function(core) {


        var ViewState = core.ViewState;
        /**
         * Create an object literal with states names as keys.
         * @param allStatesNames
         * @return {Object}
         * @private
         */
        var _createStatesObject = function(allStatesNames) {
            allStatesNames = allStatesNames.split(",");

            var statesObject = {},
                name;
            while ((name = allStatesNames.shift())) {
                name = name.trim();
                if (statesObject[name]) throw new Error("the state " + name + " is declared twice");
                statesObject[name] = null;
            }
            return statesObject;

        };


        /**
         * Add an element (state target) to a view state
         */
        var _registerStateElement = function(states, stateName, $el, $child, keepLayout, included) {
            stateName = stateName.trim();
            if (stateName === '') throw new Error("declared state on a child of " + $el.selector + " has an empty name");
            states[stateName] = states[stateName] || new ViewState(stateName, $el, keepLayout);
            states[stateName].addElement($child, included);
        };


        var _registerElementInViewStates = function(states, elStateNames, $container, $el, keepInLayout, includeIt) {
            var _ = core._;
            _.each(elStateNames, function(stateName) {
                _registerStateElement(states, stateName, $container, $el, keepInLayout, includeIt);
            });
            _.each(_.difference(_.keys(states), elStateNames), function(stateName) {
                _registerStateElement(states, stateName, $container, $el, keepInLayout, !includeIt);
            });
        };

        /**
         *  populate all view states from statesContext object
         * @param states
         * @param statesContext
         * @private
         */
        var _populateStates = function(states, statesContext) {
            var $el,
                declaredStates,
                included,
                $statesContainer = statesContext.container,
                _ = core._;

            _.each(statesContext.elements, function(elementProperties) {
                $el = elementProperties.$el;
                included = elementProperties.inc !== void 0;
                declaredStates = included ? elementProperties.inc : elementProperties.exc;

                if (declaredStates !== void 0) {
                    declaredStates = declaredStates.trim() === "all" ? statesContext.names : declaredStates.trim();
                    _registerElementInViewStates(states, declaredStates.split(','), $statesContainer, $el, statesContext.keepLayout, included);
                }

            });
            // if includeRoot is true add the state container as an included element of every state
            if (statesContext.includeRoot) {
                _.each(statesContext.names.split(","), function(name) {
                    _registerStateElement(states, name, $statesContainer, $statesContainer, statesContext.keepLayout, true);
                });
            }

        };


        return function(stateContext) {
            var states = _createStatesObject(stateContext.names);
            _populateStates(states, stateContext);
            return states;
        };


    }(_core));


    /**
     * buildStatesContext function has the responsibility to parse the DOM, or read javascript declared options
     * to build an object containing all the informations needed to create view states for further process
     */
    _core.buildStatesContext = (function(core) {
        var _config = core.config,
            _defaults = {
                includeRoot: false,
                keepLayout: true,
                deepFetch: false,
                reverseTransitions: false,
                silent: false
            };
        /**
         * return all children elements matching the selector value passed as parameter using a jQuery compatible selector.
         * If deepFetch is false it returns only direct children, otherwise returns all matching elements.
         */
        var _findElements = function($el, selector, deepFetch) {
            if (deepFetch) return $el.find("[" + selector + "]");
            return $el.children("[" + selector + "]");
        };


        /**
         * build a statesContext object from DOM states attributes declarations
         */
        var _fromDOM = function($statesContainer, options) {
            var elements = [],
                key,
                $elements,
                elDef,
                $child,
                deepFetch = options.deepFetch,
                _ = core._,
                $ = core.$;

            _.each([_config.outAttr, _config.inAttr], function(attribute) {

                $elements = _findElements($statesContainer, attribute, deepFetch);
                key = attribute.replace(_config.stateAttr + "-", "");

                _.each($elements, function(child) {
                    $child = $(child);
                    elDef = _.find(elements, function(item) {
                        return item.$el === $child;
                    }) || {
                        $el: $child
                    };
                    elDef[key] = $child.attr(attribute).trim();
                    elements.push(elDef);
                });
            });
            return elements;
        };

        /**
         * build a statesContext object from options hash
         */
        var _fromOptions = function($container, options) {
            var descriptors = [],
                descriptor,
                $children,
                $el,
                els = options.elements,
                _ = core._,
                $ = core.$;


            _.each(_.keys(els), function(selector) {
                $children = $container.find(selector);
                _.each($children, function(el) {
                    $el = $(el);
                    descriptor = {
                        $el: $el
                    };
                    _.each(["inc", "exc"], function(value) {
                        if (els[selector][value] !== void 0) descriptor[value] = els[selector][value];
                    });

                    if (els[selector].exc !== void 0) descriptor.exc = els[selector].exc;
                    descriptors.push(descriptor);
                });

            });
            return descriptors;
        };


        return function($el, options) {
            if (!$el || $el.size === 0) throw new Error("cannot build states on an unknown element");
            var findElements,
                _ = core._,
                ctx = {};

            // the state names must be declared in DOM or options . Options declaration prevails
            ctx.names = options.names || $el.attr(_config.stateAttr);
            if (ctx.names === void 0) throw new Error($el.selector + " has no state declared");

            ctx.container = $el;
            //default properties initialization
            _.extend(ctx, _defaults);
            _.extend(ctx, options);

            ctx.initialState = options.initialState ? options.initialState : ctx.names.split(",")[0];

            //findElements = _.isObject(options.elements) ? _fromOptions : _fromDOM;
            ctx.elements = _.isObject(options.elements) ? options.elements : _fromDOM($el, options);
            ctx.container = ctx.container || $el;
            return ctx;
        };
    })(_core);


    /**
     * The StateClient defines methods to enhance the client view with view states
     * - it delegates the management of the states lifecycle to its stateManager member
     * - it handles state life-cycle events with the 'onStateEvent' function
     */
    _core.StatesClient = (function(core) {

        var _buildStateContext = core.buildStatesContext,
            _buildStates = core.buildViewStates,
            ViewStatesManager = core.ViewStatesManager,
            _config = core.config,
            _events = [core.EXIT, core.EXITED, core.ENTER, core.CHANGED];


        var initializeStates = function() {
            this.currentState = null;
            this.applyDefaults();
            this.statesContext = _buildStateContext(this.$el, this.options);
            var states = _buildStates(this.statesContext);
            this.manageStates(states);
            this.setState(this.statesContext.initialState);
        };

        var applyDefaults = function() {
            var _ = core._;
            this.options = this.options || {};
            if (this.statesDefaults !== void 0) {
                _.extend(this.options, this.statesDefaults);
            }
        };

        var manageStates = function(states) {
            var _ = core._;
            this.stateManager = new ViewStatesManager({
                client: this,
                states: states
            }, this.options);
            this.$el.on(_events.join(" "), _.bind(this.onStateEvent, this));
        };


        var setState = function(name) {
            this.stateManager.setState(name);
        };

        var trigger = function(event, stateName) {
            var _ = core._;
            if (!_.isFunction(this.$el[_config.triggerFunction])) {
                this.onStateEvent(event, stateName);
                return;
            }
            this.$el[_config.triggerFunction].call(this.$el, event, stateName);
        };

        /**
         * this function defined as the state life cycle events handler is intended to be overridden
         * @param event: the event name for instance state:enter
         * @param stateName: the state that is targeted by this event
         */
        var onStateEvent = function(event, stateName) {
            _core._debug(this.$el + " " + (event.type || event) + " " + stateName);
        };

        var disposeStates = function() {
            this.currentState = null;
            this.$el.off(_events.join(" "));
            delete this.stateManager;
        };


        return {
            initializeStates: initializeStates,
            applyDefaults: applyDefaults,
            manageStates: manageStates,
            setState: setState,
            onStateEvent: onStateEvent,
            trigger: trigger,
            disposeStates: disposeStates

        };

    })(_core);


    return _core;


}(this));

(function(root) {

    'use strict';
    var require = root.require,
        _ = root._,
        angular = root.angular,
        statify = root.statify,
        statesClientDirective,
        statesIncDirective,
        statesExcDirective;

    /** set statify.$ to angular element function **/
    statify.$ = angular.element;



    if (!_ && (require !== void 0)) _ = require('underscore');

    /*
     * if underscore is not loaded implements _ functions used in statify with angular functions if possible
     */

    statify._ = _ || {
        isFunction: angular.isFunction,

        isArray: angular.isArray,

        each: angular.forEach,

        isObject: angular.isObject,

        extend: angular.extend,

        find: function(obj, predicate, context) {
            var result;
            this.each(obj, function(value, index, obj) {
                if (predicate.call(context, value, index, obj)) {
                    result = value;
                    return true;
                }
            });
            return result;
        },

        indexOf: function(array, obj) {
            if (array.indexOf && [].indexOf === array.indexOf) return array.indexOf(obj);
            for (var i = 0; i < array.length; i++) {
                if (obj === array[i]) return i;
            }
            return -1;
        },



        difference: function(a1, a2) {
            var result = [];
            var that = this;
            this.each(a1, function(value, index) {
                if (that.indexOf(a2, value) === -1) {
                    result.push(value);
                }
            });
            return result;

        },

        keys: function(o) {
            if (!o) return [];
            var keys = [];
            this.each(o, function(value, key) {
                keys.push(key);
            });
            return keys;
        },



        bind: function(fn, obj, args) {
            return angular.bind(obj, fn, args);
        }

    };



    /***
    Directives
    **/
    var StatesClientDirectiveCtrl = function($scope) {

        var stateClient = $scope;
        angular.extend(stateClient, statify.StatesClient);


        $scope.$parent.setState = function(name) {
            stateClient.setState(name);
        };

        stateClient.onStateEvent = function(event, name) {
            $scope.$emit(event, name);
        };


        stateClient.options = {};
        var elements = stateClient.options.elements = [];


        this.addToOptions = function(element, attr, value) {
            var elDesc = {},
                names =
                    elDesc.$el = element;
            elDesc[attr] = value;
            elements.push(elDesc);
        };


    };


    var statesClientDirectiveLink = function(scope, element, attrs, statesCtrl) {
        var statesClient = scope;
        statesClient.options.names = attrs.states;
        statesClient.options.initialState = statesClient.options.names.split(',')[0];
        statesClient.$el = element;
        statesClient.statesOptions = {};
        statesClient.initializeStates();

    };





    statesClientDirective = {
        restrict: 'A',
        transclude: false,
        scope: {},
        name: statify.config.stateAttr.replace("data-", ""),
        controller: StatesClientDirectiveCtrl,
        link: statesClientDirectiveLink
    };





    var incExcStatesDirectiveFactory = function(type) {
        var stateAttr = "states" + type.substring(0, 1).toUpperCase() + type.substring(1, type.length);
        return {
            name: stateAttr,
            require: '^' + statesClientDirective.name,
            restrict: 'A',
            transclude: false,
            link: function(scope, element, attrs, statesCtrl) {
                statesCtrl.addToOptions(element, type, attrs[stateAttr]);

            }
        };
    };

    statesIncDirective = incExcStatesDirectiveFactory("inc");
    statesExcDirective = incExcStatesDirectiveFactory("exc");


    statify.statifyNg = function(app) {

        app.directive(statesClientDirective.name, function() {
            return statesClientDirective;

        }).directive(statesIncDirective.name, function() {
            return statesIncDirective;

        }).directive(statesExcDirective.name, function() {
            return statesExcDirective;

        });
    };


    root.statify = statify;

}(this));
