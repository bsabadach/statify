/* global Backbone, _ , statify */
(function(root, Backbone, statify) {

    'use strict';


    statify.$ = root.$;
    statify._ = root._;


    Backbone.View.statify = function(View) {

        var StatesClientView = View.extend({
            initialize: function() {
                var args = [].slice.call(arguments, 1);
                View.prototype.initialize.call(this, args);
                this.statesOptions = args[0].states;
            },


            render: function() {
                var rendered = View.prototype.render.call(this);
                this.postRender();
                return rendered;
            },

            postRender: function() {
                if (this.statesInitialized) return;
                this.initializeStates();
                this.statesInitialized = true;
            }
        });

        // enhance Bakbone view with the StatesClient behaviour
        _.extend(StatesClientView.prototype, statify.StatesClientMixin);

        return StatesClientView;

    };
    // define and add the StatifiedView to the root of the Backbone object
    Backbone.StatifiedView = Backbone.View.statify(Backbone.View);

}(this, Backbone, statify));
