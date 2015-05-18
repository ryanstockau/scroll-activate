/*

ScrollActivate jQuery Plugin by Ryan Stock

www.github.com/ryanstockau/scroll-activate

www.ryanstock.com.au

*/

 
;(function ( $, window, document, undefined ) {
	 
	// Plugin Constructor
	
  	var ScrollActivate = function( elem, options ){
		var self = this;
		self.elem = elem;
		self.$elem = $(elem);
		self.options = options;
    };
	
	
	// Plugin Prototype
	
	ScrollActivate.prototype = {
		
		defaults: {
			elementClass : 'scrollactivate-element',
			deactivateClass : 'scrollactivate-offscreen',
			activateClass : 'scrollactivate-onscreen',
			readyClass : 'scrollactivate-ready',
			notransClass : 'scrollactivate-notrans',
			
			loopDelay : 2000, // Time between regular checks of elements
			delay : 300, // Time between activation of consecutive elements
			childDelay : 300, // Time before checking children of activated elements
			
			activateElementFilter : function(){ return $(this).attr('data-scrollactivate-activate') !== 'false'; },		
			deactivateElementFilter : function(){ return $(this).attr('data-scrollactivate-deactivate') == 'true'; }
		},
		
		// Add required classes to elements and enable scroll handler.
		init: function() {
			
			var self = this;
			
			// Add a data reference to this object
			self.$elem.data('scroll-activate', self);
			
			// Set combined config
			self.config = $.extend({}, self.defaults, self.options);
			
			self.$elem.addClass( self.config.elementClass );
		
			self._defineElements();
			
			self.$activate_only_elements
				.addClass(self.config.notransClass)
				.addClass(self.config.deactivateClass)
				.removeClass(self.config.activateClass)
				.removeClass(self.config.notransClass);
		
			self.$elem.addClass(self.config.readyClass);
			
			$(window).scroll($.proxy(self._scrollCheck,self));
			
			self._scrollCheckLoop();
			
			return self;
		},
		
		
		// Find and store all types of elements.
		_defineElements : function() {
			var self = this;			
			self.$activate_elements = self.$elem.filter( self.config.activateElementFilter );
			self.$deactivate_elements = self.$elem.filter( self.config.deactivateElementFilter );
			self.$activate_only_elements = self.$activate_elements.not( self.$deactivate_elements );
			self.$deactivate_only_elements = self.$deactivate_elements.not( self.$activate_elements );
			
			self.$control_elements = self.$elem.filter(function() {
				return $(this).attr('data-scrollactivate-linkchildren') == 'true';
			});
			
			// Define all elements that have another valid element above them
			self.$child_elements = self.$control_elements.find(self.$elem).filter(function(){
				return $(this).parents('.'+self.config.elementClass).length;
			});
			self.$child_elements.addClass('scrollactivate-child');
			self.$base_elements = self.$elem.not(self.$child_elements);
		},
		
		
		// Check if element are on screen (except if skip_check), then de/activate them.
		_updateElements : function( $elements, delay, skip_check ) {
			var self = this;
			if ( typeof $elements == 'undefined' ) {
				var $elements = self.$base_elements;
			}
			if ( ! $elements.length ) {
				return;	
			}
			if ( typeof delay == 'undefined' ) {
				var delay = self.config.elementDelay;
			}
			var checked_elements, $visible_elements, $invisible_elements;
			if ( skip_check ) {
				$visible_elements = $elements.filter(self.$activate_elements);
				$invisible_elements = $();
			} else {
				checked_elements = self._checkElementVisibilities( $elements );
				$visible_elements = checked_elements.visible.filter(self.$activate_elements);
				$invisible_elements = checked_elements.hidden.filter(self.$deactivate_elements);
			}
			
			
			setTimeout( function() {
				$visible_elements.each(function(index,element){
					var $element = $(this);
					var element_delay = 0;
					if ( ! ( element_delay = $element.attr('data-scrollactivate-delay') ) ) {
						element_delay = self.config.delay * index; // todo: should config delay get added to delay instead?			
					}
					// todo: optimise this so when there are lots with the same delay, do them together? Maybe turn them into an array with delay as key or something.
					setTimeout( function() {
						$element.addClass('skip-check-'+(skip_check?'1':'0'));
						self._activateElements( $element );	
					}, element_delay );
				});
				self._deactivateElements( $invisible_elements );				
			}, delay);			
		},
		
		
		_activateElements : function( $elements ) {
			var self = this;
			var $control_elements = $();
			var $valid_elements = $elements.not('.'+self.config.activateClass);
			
			$valid_elements.removeClass(self.config.deactivateClass).addClass(self.config.activateClass);
			if ( $valid_elements.length ) {
				$valid_control_elements = $valid_elements.filter( self.$control_elements );
				$valid_elements = $valid_elements.not( $control_elements );
			}
			var $children;
			if ( $valid_control_elements.length ) {
				// Update all child elements (while skipping the position check on them)
				$children = $valid_control_elements.children(self.$child_elements);
				if ( $children.length ) {
					self._updateElements( $children, self.config.childDelay, true );
				}
			}
			if ( $valid_elements.length ) {
				$children = $valid_elements.find(self.$child_elements);
				if ( $children.length ) {
					self._updateElements( $children, self.config.childDelay );
				}
			}
		},
		
		
		_deactivateElements : function( $elements ) {
			var self = this;
			$elements.add( $elements.find(self.$child_elements) )
				.removeClass(self.config.activateClass)
				.addClass(self.config.deactivateClass);			
		},
		
		
		_checkElementVisibilities : function( $elements ) {			
			var self = this;
			var window_height = $(window).height(),
				window_scrolltop = $(window).scrollTop(),
				$visible_elements = $(),
				$hidden_elements = $(),
				elements;
				
			if ( typeof $elements == 'undefined' ) {
				var $elements = self.$elem;
			}
								
			$elements.each(function(index){
				var $element = $(this);
				var	min_position, 
					max_position;
				if ( ! ( min_position = $element.attr('data-scrollactivate-offset-top') ) ) {
					min_position = window_height * 1/8;	
				}
				if ( ! ( max_position = $element.attr('data-scrollactivate-offset-bottom') ) ) {
					max_position = window_height * 7/8;					
				}
				if ( 'bottom' == min_position ) {
					max_position = window_height;	
				}
				if ( 'bottom' == max_position ) {
					max_position = window_height;	
				}
				
				var top = $element.offset().top;
				var bottom = top + $element.height();
				
				var top_rel_position = top - window_scrolltop;								
				var top_is_high_enough = ( top_rel_position >= min_position );
				var top_is_low_enough = ( top_rel_position <= max_position );				
				var top_is_on_screen = ( top_is_high_enough && top_is_low_enough );
								
				var bottom_rel_position = bottom - window_scrolltop;
				var bottom_is_high_enough = ( bottom_rel_position >= min_position );
				var bottom_is_low_enough = ( bottom_rel_position <= max_position );				
				var bottom_is_on_screen = ( bottom_is_high_enough && bottom_is_low_enough );
				
				var top_and_bottom_are_on_opposite_sides = ( top_rel_position < min_position ) && ( bottom_rel_position > max_position );				
				
				// Show elements when they appear on screen
				if ( top_is_on_screen || bottom_is_on_screen || top_and_bottom_are_on_opposite_sides ) {
					$visible_elements = $visible_elements.add( $element );
				} else {
					$hidden_elements = $hidden_elements.add( $element );
				}
			});
			return {
				visible : $visible_elements,
				hidden : $hidden_elements
			};			
		},	
	
		
		_scrollCheck : function( event ) {	
			var self = this;
			// If we last scrolled very recently, ignore this
			if ( self.lastScrollCheck > $.now() - 150 ) {
				return;
			}
			self.lastScrollCheck = $.now();
			// If we scrolled fairly recently and are about to run our check, ignore this
			if ( self.scrollCheckTimeout ) {
				return;	
			}
			// Otherwise update elements after a timeout
			self.scrollCheckTimeout = setTimeout( function() {
				self._updateElements();
				clearTimeout( self.scrollCheckTimeout );
				self.scrollCheckTimeout = null;
			}, 150 );
		},
		
		
		// Check our elements at a regular interval (in case the page changed and we haven't scrolled)
		_scrollCheckLoop : function() {
			var self = this;
			self._scrollCheck();
			setTimeout( $.proxy(self._scrollCheckLoop,self), self.config.loopDelay );			
		}
				
	}
	
	ScrollActivate.defaults = ScrollActivate.prototype.defaults;


	
	// Create plugin
	
	$.fn.scrollActivate = function(options) {
		return new ScrollActivate(this, options).init();
	};
	
})( jQuery, window , document );