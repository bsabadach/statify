#statify.js


[![Build Status](https://travis-ci.org/bsabadach/statify.png?branch=master)](https://travis-ci.org/bsabadach/statify)

Add and manage states of HTML components using one of your favorite js tech: jQuery, Backbone or angular.

## License

MIT - See LICENSE.txt


## Goal
The state of an HTML container could be defined by the way the container and its child elements are styled, positioned and visible or not.

**statify.js** is a JavaScript library that easily permits the creation and management of states on HTML containers. 

**statify.js** is can be used as a library on its own but as add on or extension to other JavaScript libraries or frameworks. For now on there’s an implantation for jQuery, Backbone and angular.js.

## Features

+ Define the different states of the HTML container declaratively with some HTML 5 data-* attributes.
-	Declare elements style change on different states by writing  CSS rules following a simple naming policy.
-	Initialize and manage the state machine with a simple JavaScript API.
-	Observe state lifecycle through event listening to synchronize your business logic with (even if your states have CSS3 animations).
-	Choose between several options to configure the behavior at your need. 

____



## General usage

choose between the three implementations of statify.js scripts in dist directory and add it to your page

### Declare states of an HTML element or container

	   <div  class="my-container" data-states="A,B,C">
		…..
      </div>


### Identify which elements belong to which states
+ Use **`data-states-inc`** to include the element in the state(s) defined in the attribute value (it could be comma separated list of states). Element will be therefore excluded from the other states. 
**`data-states-inc=”all”`** is a shorthand to include the element in every state.
+	Use **`data-states-exc`** to exclude the element from the state(s) defined in the attribute value. It will be therefore included in the other states.

Here is a simple example

	<div>
        <div class="state-container" data-states="A,B,C">

            <div class="simple-item-common simple-item-one" data-states-inc="A">
                <span>included in A</span>
            </div>
            <div class="simple-item-common simple-item-two" data-states-inc="A,B">
                <span>included in A,B</span>
            </div>
            <div class="simple-item-common simple-item-three" data-states-exc="A">
                <span>excluded from A</span>
            </div>

        </div>
    </div>



### Write CSS rules
for each implied elements according the following naming policy: add “--“ at the end of the rule followed by the state name.
In your above case the CSS style sheet should declare the following styles: 

	item-two{
		....
	} 
	item-two--A{
		....
	}
	
	item-two--B{
		....
	}

The rule state modifier is applied on the last declared rule in the class attribute value. The value of the CSS rule name modifier is configurable.



### Use javascript API

on the javascript side you must create a javascript state client object according the library you chose.  



choose among the [statify implementation](https://github.com/bsabadach/statify/tree/master/build) you want to use (don't use statify-core.js). The **`statify`** object is added to the global scope.

##### initializing states
once your DOM is loaded create the state machine object:

####### with jQuery

	var stateClientView = $(unique-element-selector).statify().statified();

####### with Backbone
 	var stateClientView= new Backbone.StatesClientView({
          el:'unique-element-selector'
      });
 or u can create a state client view from your own base view:

	var MyStateClientViewClass=Backbone.statify(MyBaseViewClass);
and instanciate it as previously showned.


###### with angular
create an app with the statify dependency: it loads all the directives needed:

	var app = angular.module('myApp', ['statify-ng']); 


##### changing the state

####### with jQuery or Backbone
	stateClientView.setState('statename');

####### with angular
the library added a setState method on the parent scope of the container using the statify directives. For instance you cann add a button that does the trick

		<div class="state-container" data-states="A,B,C">
     		.......
			<button ng-click="setState('A')>select A</button>
			<button ng-click="setState('B')>select A</button>

        </div>



##### listening to state change events

For simple case without CSS animation only use the `state:changed ` event type available as a constant in the global `statify` object  :`statify.STATE_CHANGED`

####### for jQuery

override the onStateEvent function ont the state client
```javascript
	stateClientView.onStateEvent=function(eventType,stateName){
		// do what you want
	}
```

###### for Backbone

extend and override the onStateEvent function
```javascript
	var MyStateClientView=Backbone.StatesClientView.extend({ 
	onStateEvent=function(eventType,stateName){
			// do what you want
		}
	);
```
Then instanciate your view.
	 


####### with angular
you need to  do this a controller declared on the HTML container:

	<div class="state-container" data-states="A,B,C" ng-controller="MyCtrl">

The listen to state change event in the controller on the $scope object:

```javascript
	app.controller('MyCtrl', function($scope) {
     	 	$scope.$on("state:changed",function (eventType,stateName){
    });
```




### states initialization options

The library provides several useful options : they are all optional and have a default value. If needed declare them on the root container using `data-states-xx` where x is one of the following values:

+	`initial`:  the initial states in which the container should be rendered.
+	`keepLayout`: choose to remove or leave the invisible elements from the layout when they are is their excluded state.
+	`includeRoot`: include the HTML container in all states if u want   . 
+	`deepFetch`:   only for jquery and backbone. chose to find included or excluded elements among direct children or among deeply nested ones in  the HTML container.
+	`reverseTrans`:  simulate a transition in/ transition out by playing a css  transition in reverse when leaving a state

Here is how it could look like:

			<div data-states='A,B' 
          		 data-states-deepFetch
          		 data-states-keepLayout="false"
				 data-states-reverseTrans >
			....
			</div>

