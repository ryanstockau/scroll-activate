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
		
		// Allow options to be presented via HTML data-plugin-options attribute, eg:
		// <div class='item' data-plugin-options='{"message":"Goodbye World!"}'></div>
		self.metadata = self.$elem.data( 'plugin-options' );
    };
	
	
	
	// Vars
	
	var last_scroll_check = 0;
	var scroll_check_timeout;
	
	
	// Plugin Prototype
	
	ScrollActivate.prototype = {
		
		defaults: {
			deactivateClass : 'scrollactivate-deactivate',
			visibleClass : 'scrollactivate-activate',
			readyClass : 'scrollactivate-ready',
			notransClass : 'scrollactivate-notrans',
			
			loopDelay : 2000, // Time between regular checks of elements
			delay : 300, // Time between activation of consecutive elements
			childDelay : 300, // Time before checking children of activated elements
			
			activateElementFilter : function(){ return $(this).attr('data-scrollactivate-activate') !== 'false'; },		
			deactivateElementFilter : function(){ return $(this).attr('data-scrollactivate-deactivate') == 'true'; }
		},
		
		
		init: function() {
			
			var self = this;
			
			// Add a data reference to this object
			self.$elem.data('scroll-activate', self);
			
			// Set combined config
			self.config = $.extend({}, self.defaults, self.options, self.metadata);
		
			self._defineElements();
			
			self.$activate_only_elements
				.addClass(self.config.notransClass)
				.addClass(self.config.deactivateClass)
				.removeClass(self.config.visibleClass)
				.removeClass(self.config.notransClass);
		
			self.$elem.addClass(self.config.readyClass);
			
			self._scrollCheckLoop();
			
			return self;
		},
		
		
		_defineElements : function() {
			self.$activate_elements = self.$elem.filter( self.config.activateElementFilter );
			self.$deactivate_elements = self.$elem.filter( self.config.deactivateElementFilter );
			self.$activate_only_elements = self.$activate_elements.not( self.$deactivate_elements );
			self.$deactivate_only_elements = self.$deactivate_elements.not( self.$activate_elements );
			
			self.$base_elements = self.$elem.not('.'+self.config.elementClass+' '+'.'+self.config.elementClass);
			self.$child_elements = self.$elem.not(self.$base_elements);
		},
		
		
		_updateElements : function( $elements, delay ) {
			var self = this;
			if ( typeof $elements == 'undefined' ) {
				var $elements = self.$base_elements;
			}
			if ( typeof delay == 'undefined' ) {
				var delay = self.config.elementDelay;
			}
			var checked_elements = self._checkElementVisibilities( $elements );
			var $visible_elements = checked_elements.visible;
			var $invisible_elements = checked_elements.hidden;
			
			setTimeout( function() {
				self._activateElements( $visible_elements.is(self.$activate_elements) );				
				self._deactivateElements( $invisible_elements.is(self.$deactivate_elements) );				
			}, delay);			
		},
		
		
		_activateElements : function( $elements ) {
			$elements.not(self.config.visibleClass)
				.removeClass(self.config.deactivateClass)
				.addClass(self.config.visibleClass);
			self._updateElements( $elements.find(self.$child_elements), self.config.childDelay );
		},
		
		
		_deactivateElements : function( $elements ) {
			$elements.add( $elements.find(self.$child_elements) )
				.removeClass(self.config.visibleClass)
				.addClass(self.config.deactivateClass);			
		},
		
		
		_checkElementVisibilities : function( $elements ) {			
			var self = this;
			var window_height = $(window).height(),
				window_scrolltop = $(window).scrollTop(),
				visible_elements,
				hidden_elements,
				elements;
				
			if ( typeof $elements == 'undefined' ) {
				var $elements = self.$elem;
			}
								
			$elements.each(function(){
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
				if ( ! ( element_delay = $element.attr('data-scrollactivate-delay') ) ) {
					element_delay = delay * index;					
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
				
				var top_and_bottom_are_on_opposite_sides = ( top < min_position ) && ( bottom > max_position );				
				
				// Show elements when they appear on screen
				if ( top_is_on_screen || bottom_is_on_screen || top_and_bottom_are_on_opposite_sides ) {
					visible_elements.push( $element );
				} else {
					hidden_elements.push( $element );
				}
			});
			return {
				visible : $(visible_elements),
				hidden : $(hidden_elements)
			};			
		},
	
		
		_scrollCheck : function( event ) {	
			// If we last scrolled very recently, ignore this
			if ( last_scroll_check > $.now() - 100 ) {
				return;
			}
			last_scroll_check = $.now();
			// If we scrolled fairly recently and are about to run our check, ignore this
			if ( scroll_check_timeout ) {
				return;	
			}
			// Otherwise update elements after a timeout
			scroll_check_timeout = setTimeout( function() {
				self._updateElements();
				clearTimeout( scroll_check_timeout );
				scroll_check_timeout = null;
			}, 100 );
		},
		
		
		// Check our elements at a regular interval (in case the page changed and we haven't scrolled)
		_scrollCheckLoop : function() {
			self._scrollCheck();
			setTimeout( self._scrollCheckLoop, self.config.loopDelay );			
		}
				
	}
	
	ScrollActivate.defaults = ScrollActivate.prototype.defaults;
	
	
	// Create plugin
	
	$.fn.scrollActivate = function(options) {
		return this.each(function() {
			new ScrollActivate(this, options).init();
		});
	};
	
})( jQuery, window , document );