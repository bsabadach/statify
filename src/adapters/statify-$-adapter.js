/* global jQuery:false,statify:false */
(function (root, $, statify) {

	'use strict';

	//---------------------------------------------------------------------------------
	// utilities functions needed for the project
	//---------------------------------------------------------------------------------
	var slice = [].slice,
		concat = [].concat,
		require = root.require,
		_ = root._;

	// if underscore is not loaded implements _ functions used in statify with $ functions adapters
	if (!_ && (require !== void 0)) _ = require('underscore');

	_ = _ || {
		isFunction: $.isFunction,

		isArray: $.isArray,

		find: function (list, iterator) {
			var found = $.grep(list, iterator);
			return found[0];
		},

		indexOf: function (list, value) {
			return $.inArray(value, list);
		},

		each: function (list, iterator, ctx) {
			return $.each(list, function (index, value) {
				if (ctx !== void 0) iterator.call(ctx, value, index);
				else iterator(value, index);
			});
		},

		difference: function (array) {
			var rest = concat.apply(slice.call(arguments, 1));
			return $.grep(array, function (value) {
				return !$.inArray(rest, value);
			});
		},

		keys: function (o) {
			return $.map(o, function (value, key) {
				return key;
			});
		},
		isObject: $.isPlainObject,

		extend: $.extend,

		bind: $.proxy


	};



	statify.$ = $;
	statify._ = _;


	//---------------------------------------------------------------------------------
	// plugin definition
	//---------------------------------------------------------------------------------

	$.fn.statify = function (options) {
		var statesClient = {};

		statesClient.$el = $(this);

		statesClient.statesOptions = options || {};

		$.extend(statesClient, statify.StatesClientMixin);

		statesClient.initializeStates();

		$.data(this, statify.ns, statesClient);

		return this;

	};

	// return the 'statified' version of the element
	$.fn.statified = function () {
		return $.data(this, statify.ns);
	};


	$.fn.unStatify = function () {
		if (!$.data(this, statify.ns)) return this;
		$.data(this, statify.ns).disposeStates();
		$.data(this, statify.ns, null);
		return this;
	};



}(this, jQuery, statify));