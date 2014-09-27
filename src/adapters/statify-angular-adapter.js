(function(root) {

    'use strict';

    var require = root.require,
        _ = root._,
        angular = root.angular,
        statify = root.statify,
        statesClientDirective,
        statesIncDirective,
        statesExcDirective;


    /**
     * Directive object for data-states attribute
     */

    statesClientDirective = {
        restrict: 'A',
        transclude: false,
        scope: {},
        name: statify.config.attr.states.replace("data-", ""),
        controller: StatesClientDirectiveCtrl,
        link: statesClientDirectiveLink
    };

    /**
     * Directive objects for data-states-inc et adata-states-exc attributes
     */
    statesIncDirective = createIncExcStatesDirective("inc");
    statesExcDirective = createIncExcStatesDirective("exc");


    //------------------------------
    // define angular module
    //------------------------------
    angular.module('statify-ng', [])

    .directive(statesClientDirective.name, function() {
        return statesClientDirective;

    }).directive(statesIncDirective.name, function() {
        return statesIncDirective;

    }).directive(statesExcDirective.name, function() {
        return statesExcDirective;

    }).factory('ngStatity', function() {
        return statify;
    });



    /**
     * Controller object for data-states directive
     */
    function StatesClientDirectiveCtrl($scope, ngStatity) {

        //function that makes the communication between the data-states-inc and data-states-exc directives with data-states directive controller
        this.addStateElement = function(element, attr, value) {
            var elDesc = {};
            elDesc.$el = element;
            elDesc[attr] = value;
            elements.push(elDesc);
        };

        // the scope directive is enhanced to behave as the stateClient
        var stateClient = $scope;
        angular.extend(stateClient, ngStatity.StatesClientMixin);

        //expose the setState function to the parent scope so that it could be used by angular directive
        // ex: ng-click="setState('A')"
        $scope.$parent.setState = function(name) {
            stateClient.setState(name);
        };

        // when a state event is handled by the client, emit the event so that the parent scope can capture it in the controller
        stateClient.onStateEvent = function(event, name) {
            $scope.$emit(event, name);
        };

        //initialize state client options
        stateClient.options = {};
        var elements = stateClient.options.elements = [];


        //dispose states on destroy
        $scope.$on('$destroy', function() {
            stateClient.disposeStates();
        });

    }

    /**
     * Link function for data-states directive: states are initialized here
     */
    function statesClientDirectiveLink(scope, el, attrs, statesCtrl) {
        var statesClient = scope;
        statesClient.options.names = attrs.states;
        statesClient.options.initialState = statesClient.options.names.split(',')[0];
        statesClient.$el = angular.element(el);
        statesClient.statesOptions = {};
        statesClient.initializeStates();

    }



    /**
     * Directive factory for data-states-inc and data-states-exc directives
     */
    function createIncExcStatesDirective(type) {
        var stateAttr = "states" + type.substring(0, 1).toUpperCase() + type.substring(1, type.length);
        return {
            name: stateAttr,
            require: '^' + statesClientDirective.name,
            restrict: 'A',
            transclude: false,
            link: function(scope, element, attrs, statesCtrl) {
                statesCtrl.addStateElement(element, type, attrs[stateAttr]);
            }
        };
    }





    //------------------------------
    // implements utilies
    //------------------------------

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



}(this));
