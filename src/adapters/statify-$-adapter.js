/* global jQuery:false,statify:false */
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
