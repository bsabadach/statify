//
// statify - v0.2.0
// The MIT License
// Copyright (c) 2014 Boris Sabadach <boris@washmatique.fr> 
//
var statify = (function(root) {

    "use strict";

    var document = root.document,
        console = root.console,
        CSSStyleRule = root.CSSStyleRule,
        CSSRule = root.CSSRule,
        setTimeout = root.setTimeout,
        core = {};


    //-------------------------------------
    // configuration
    //-------------------------------------

    core.VERSION = "0.1.0";


    core.ns = "washm.statify";


    core.config = {
        attr: {
            states: "data-states",
            inc: "data-states-inc",
            exc: "data-states-exc"
        },
        optionsAttr: {
            initial: "data-states-initial",
            keepLayout: "data-states-keepLayout",
            includeRoot: "data-states-includeRoot",
            deepFetch: "data-states-deepFetch",
            reverseTrans: "data-states-reverseTrans",
        },
        cssModifier: "--",
        triggerFn: "trigger"
    };


    // turn off debug by default
    core.DEBUG = false;


    //-------------------------------------
    // utilities
    //-------------------------------------


    // debug function
    core._debug = (function() {
        var join = [].join,
            canLog = console && console.log;
        return function() {
            return canLog && core.DEBUG && console.log(join.call(arguments, ','));
        };
    }());

    // noop function with debug
    var notImplemented = function(name) {
        return function() {
            core._debug(name + "  is not implemented");
        };
    };

    // define util functions used in the project
    var utilMethods = ["isFunction", "isArray", "find", "indexOf", "each", "difference", "keys", "isObject", "extend", "bind"];

    core._ = {};

    // add them do _ variable and mark them as not implemented
    for (var i in utilMethods) {
        core._[utilMethods[i]] = notImplemented(utilMethods[i]);
    }



    /**
     * add the trim function to String object if not implemented
     * @type {*}
     */
    if (typeof String.prototype.trim !== "function") {
        String.prototype.trim = core._.trim || core.$.trim;
    }


    /**
     * CSS utilities
     * @type {*}
     */
    core.CSS = (function(document, core) {
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

    }(document, core));


    //-------------------------------------
    // state machine implementation
    //-------------------------------------


    core.EXIT = "state:exit";
    core.EXITED = "state:exited";
    core.ENTER = "state:enter";
    core.CHANGED = "state:changed";


    /**
     * The ViewStateElement object wraps a DOM element (queried by the DOM selector library) that has a role in a view state.
     * The class provides methods to manage the element visibility and style when view state changes.
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
                if (originalDisplay) this.display.yes = originalDisplay;
            }

            this.configure();
        };

        ViewStateElement.prototype = {
            configure: function() {
                if (this.$el.attr("class") === void 0) {
                    this.hasDeclaredStyle = false;
                    return;
                }
                this.hasDeclaredStyle = true;
                this.baseStyle = this.$el.attr("class").split(" ").pop();
            },

            isDisplayed: function() {
                return this.$el.css(this.display.type) !== this.display.no;
            },

            toggle: function() {
                this.$el.css(this.display.type, this.isDisplayed() ? this.display.no : this.display.yes);
            },

            removeStateStyle: function(state) {
                if (!this.hasDeclaredStyle) return;
                var style = this.baseStyle + _config.cssModifier + state;
                if (style && this.$el.hasClass(style)) this.$el.removeClass(style);
            },

            addStateStyle: function(state) {
                if (!this.hasDeclaredStyle) return;
                var selector = this.getStyleSelector(state);
                if (_CSS.hasRule(selector)) this.$el.addClass(selector.replace(".", ""));
            },

            getStyleSelector: function(state) {
                if (!this.hasDeclaredStyle) return null;
                return "." + this.baseStyle + _config.cssModifier + state;
            }

        };
        core.ViewStateElement = ViewStateElement;

    }(core));


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

    }(core));


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
                this.nextState = this.currentState = null;
            },

            notifyClient: function(event, stateName) {
                this.client.trigger(event, stateName);
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


    }(core));

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

            initialize: function() {
                var _ = core._;
                this.isPlaying = false;
                this.callBack = null;
                var that = this;
                this.onComplete = function() {
                    that.callBack();
                    that.isPlaying = false;
                };
            },

            playOn: function(state) {
                this._startOn(state, false);
            },

            reverseOn: function(state) {
                this._startOn(state, true);
            },

            _startOn: function(state, reverseIt) {
                this.isPlaying = true;
                var duration = this._getTotalDuration(state);
                this._start(state, duration, this.onComplete, reverseIt);
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
            }


        };

        core.ViewStateTransition = ViewStateTransition;

        /**
         * some ViewStatesManager function must be over-written  if browser supports transitions to
         * - listen to CSS3 transitions on state change
         * - trigger full state lifecycle events
         */

        var _extend = function(destination, source) {
            for (var prop in source) {
                if (source.hasOwnProperty(prop)) {
                    destination[prop] = source[prop];
                }
            }
        };

        _extend(core.ViewStatesManager.prototype, {

            initialize: function(options) {
                this.reverseTrans = options.reverseTrans;
                this.transition = new ViewStateTransition();
                var _ = core._;
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
                if (this.reverseTrans) {
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

    }(core));


    /**
     * States builder function: build view states from statesContext object
     * @type {*}
     */
    core.buildViewStates = (function(core) {



        return function(stateContext) {
            var states = _createStatesObject(stateContext.names);
            _populateStates(states, stateContext);
            return states;
        };



        /**
         * Create an object literal with states names as keys.
         * @param allStatesNames
         * @return {Object}
         * @private
         */
        function _createStatesObject(allStatesNames) {
            allStatesNames = allStatesNames.split(",");

            var statesObject = {},
                name;
            while ((name = allStatesNames.shift())) {
                name = name.trim();
                if (statesObject[name]) throw new Error("the state " + name + " is declared twice");
                statesObject[name] = null;
            }
            return statesObject;

        }



        /**
         *  populate all view states from statesContext object
         * @param states
         * @param statesContext
         * @private
         */
        function _populateStates(states, statesContext) {
            var $el,
                declaredStates,
                included,
                $statesContainer = statesContext.container,
                _ = core._,
                ViewState = core.ViewState;

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


        }

    }(core));


    /**
     * buildStatesContext function has the responsibility to parse the DOM, or read javascript declared options
     * to build an object containing all the information needed to create view states for the DOM container
     */
    core.buildStatesContext = (function(core) {
        var _attr = core.config.attr,
            _optionsAttr = core.config.optionsAttr,
            _defaults = {
                includeRoot: false,
                keepLayout: true,
                deepFetch: false,
                reverseTrans: false
            };

        var string2Boolean = {
            "false": false,
            "true": true
        };


        return function($el, options) {
            if (!$el || $el.size === 0) throw new Error("cannot build states on an unknown element");
            var fetchElements,
                _ = core._,
                statesContext = {};
            options = options || {};

            // the state names must be declared in DOM or options . Options declaration prevails
            statesContext.names = options.names || $el.attr(_attr.states);
            if (statesContext.names === void 0) throw new Error($el.selector + " has no state declared");

            statesContext.container = $el;


            //default properties initialization
            _.extend(statesContext, _defaults);

            // assign statesContext options with options object
            _.extend(statesContext, options);

            //sets the initial state for the container: by default the first in the list
            statesContext.initialState = options.initialState ? options.initialState : statesContext.names.split(",")[0];

            //apply default option value if not declared
            _.each(_.keys(_optionsAttr), function(key) {
                var attrValue = $el.attr(_optionsAttr[key]);
                if (attrValue !== void 0) {
                    attrValue = attrValue === "" ? true : string2Boolean[attrValue.toLowerCase()];
                    statesContext[key] = attrValue;
                }
            });


            if (_.isArray(options.elements)) {
                statesContext.elements = _fromOptions($el, statesContext.elements);
            } else {
                statesContext.elements = _fromDOM($el, statesContext.deepFetch);
            }

            statesContext.container = statesContext.container || $el;
            return statesContext;
        };


        /**
         * build the statesContext element list from options hash: here the only task is to transform string selector into jQuery object or equivallent
         */
        function _fromOptions($container, elements) {
            var elementsList = [],
                _ = core._,
                $ = core.$,
                $el;

            _.each(elements, function(elDescriptor) {
                if (!_.isObject(elDescriptor.$el)) {
                    $el = $(elDescriptor.el, $container);
                    elDescriptor.$el = $el;
                    if ("el" in elDescriptor) delete elDescriptor.el;
                }
                elementsList.push(elDescriptor);
            });
            return elementsList;
        }





        /**
         * build a statesContext element list from DOM states attributes declarations : data-states-*
         */
        function _fromDOM($statesContainer, deepFetch) {
            var elementsList = [],
                key,
                $elements,
                elDef,
                $child,
                _ = core._,
                $ = core.$;

            _.each([_attr.exc, _attr.inc], function(attribute) {

                $elements = _findElements($statesContainer, attribute, deepFetch);
                key = attribute.replace(_attr.states + "-", "");

                _.each($elements, function(child) {
                    $child = $(child);
                    elDef = _.find(elementsList, function(item) {
                        return item.$el === $child;
                    }) || {
                        $el: $child
                    };
                    elDef[key] = $child.attr(attribute).trim();
                    elementsList.push(elDef);
                });
            });
            return elementsList;
        }




        /**
         * return all children elements matching the selector value passed as parameter using a jQuery compatible selector.
         * If deepFetch is false it returns only direct children, otherwise returns all matching elements if the selector has this feature
         */
        function _findElements($el, selector, deepFetch) {
            if (deepFetch) return $el.find("[" + selector + "]");
            return $el.children("[" + selector + "]");
        }



    })(core);


    /**
     * The StateClientMixin defines methods to enhance the client with view states management features
     * - it delegates the management of the states lifecycle to its stateManager member
     * - it handles state life-cycle events with the 'onStateEvent' function
     */
    core.StatesClientMixin = (function(core) {



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

        /**
         * sets defaults values if found in options
         */
        var applyDefaults = function() {
            var _ = core._;
            this.options = this.options || {};
            if (this.statesDefaults !== void 0) {
                _.extend(this.options, this.statesDefaults);
            }
        };

        var manageStates = function(states) {
            var _ = core._,
                stateManagerOptions = {
                    reverseTrans: this.statesContext.reverseTrans
                };
            this.stateManager = new ViewStatesManager({
                client: this,
                states: states
            }, stateManagerOptions);
            this.$el.on(_events.join(" "), _.bind(this.onStateEvent, this));
        };


        var setState = function(name) {
            this.stateManager.setState(name);
        };

        var trigger = function(event, stateName) {
            core._debug(this.$el + " " + (event.type || event) + " " + stateName);
            var _ = core._,
                fn = this.$el[_config.triggerFn];
            if (!_.isFunction(fn)) {
                this.onStateEvent(event, stateName);
                return;
            }
            fn.call(this.$el, event, stateName);
        };

        /**
         * this function defined as the state life cycle events handler and is intended to be overridden
         * @param event
         * @param stateName
         */
        var onStateEvent = function(event, stateName) {
            core._debug(this.$el + " " + (event.type || event) + " " + stateName);
        };

        /**
         * releases the clients
         */
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


    })(core);


    return core;


}(this));

(function(root, $, statify) {

    'use strict';

    //---------------------------------------------------------------------------------
    // utilities functions needed for the project
    //---------------------------------------------------------------------------------
    var slice = [].slice,
        concat = [].concat,
        require = root.require,
        _ = root._;


    //---------------------------------------------------------------------------------
    // plugin definition: !!!!! works for one element only
    //---------------------------------------------------------------------------------

    $.fn.statify = function(options) {
        if ($.data(this, statify.ns)) return this;

        var statesClient = {};

        statesClient.$el = $(this);

        statesClient.options = options || {};

        $.extend(statesClient, statify.StatesClientMixin);

        statesClient.initializeStates();

        $.data(this, statify.ns, statesClient);

        return this;

    };

    // return the 'statified' version of the element
    $.fn.statified = function() {
        return $.data(this, statify.ns);
    };


    $.fn.unStatify = function() {
        if (!$.data(this, statify.ns)) return this;
        $.data(this, statify.ns).disposeStates();
        $.data(this, statify.ns, null);
        return this;
    };






    //------------------------------
    // utilies
    //------------------------------

    // if underscore is not loaded implements _ functions used in statify with $ functions adapters
    if (!_ && (require !== void 0)) _ = require('underscore');

    _ = _ || {
        isFunction: $.isFunction,

        isArray: $.isArray,

        find: function(list, iterator) {
            var found = $.grep(list, iterator);
            return found[0];
        },

        indexOf: function(list, value) {
            return $.inArray(value, list);
        },

        each: function(list, iterator, ctx) {
            return $.each(list, function(index, value) {
                if (ctx !== void 0) iterator.call(ctx, value, index);
                else iterator(value, index);
            });
        },

        difference: function(arr1, arr2) {
            return $.grep(arr1, function(value) {
                return $.inArray(value, arr2) === -1;
            });
        },

        keys: function(o) {
            return $.map(o, function(value, key) {
                return key;
            });
        },
        isObject: $.isPlainObject,

        extend: $.extend,

        bind: $.proxy


    };



    statify.$ = $;
    statify._ = _;





}(this, jQuery, statify));
