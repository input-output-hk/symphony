/*
* jQuery Mobile Framework : "slider" plugin
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* Forked by @damienromito and Elmundio87 to add vertical orientation
* http://jquery.org/license
*created by Elmundio87
*Updated by damienromito:
*-adapted with JQM 1.0 Final version
*-add step without keyboard
*/


( function( $, undefined ) {

$.widget( "mobile.slider", $.mobile.widget, {
	options: {
		theme: null,
		trackTheme: null,
		disabled: false,
		initSelector: "input[type='range'], :jqmData(type='range'), :jqmData(role='slider')"
	},

	_create: function() {

		// TODO: Each of these should have comments explain what they're for
		var self = this,

			control = this.element,

			parentTheme = $.mobile.getInheritedTheme( control, "c" ),

			theme = this.options.theme || parentTheme,

			trackTheme = this.options.trackTheme || parentTheme,

			cType = control[ 0 ].nodeName.toLowerCase(),

			selectClass = ( cType == "select" ) ? "ui-slider-switch" : "",

			controlID = control.attr( "id" ),

			labelID = controlID + "-label",
			
			

			label = $( "[for='"+ controlID +"']" ).attr( "id", labelID ),

			val = function() {
				
				result= ( cType == "input" ) ? parseFloat( control.val() ) : control[0].selectedIndex;
				
			
				return result;
		
		
			},

			min =  cType == "input" ? parseFloat( control.attr( "min" ) ) : 0,

			max =  cType == "input" ? parseFloat( control.attr( "max" ) ) : control.find( "option" ).length-1,
			
			sliderOrientation = control.attr( "sliderOrientation") || "horizontal",
			
			step = window.parseFloat( control.attr( "step" ) || 1 ),
			
			
			mod_slider=( cType == "select" )?"ui-slider ":"ui-slider-" + sliderOrientation,
						
						
			slider = $( "<div class='ui-slider "+mod_slider+" " + selectClass + " ui-btn-down-" + trackTheme +	" ui-btn-corner-all' role='application'></div>" ),
									
			mod_handle=( cType == "select" )?"ui-slider-handle":"ui-slider-handle-"+sliderOrientation,

			handle = $( "<a href='#' class='"+mod_handle+"'></a>" )
				.appendTo( slider )
				.buttonMarkup({ corners: true, theme: theme, shadow: true })
				.attr({
					"role": "slider",
					"aria-valuemin": min,
					"aria-valuemax": max,
					"aria-valuenow": val(),
					"aria-valuetext": val(),
					"title": val(),
					"aria-labelledby": labelID
				}),
			options;
		
		$.extend( this, {
			slider: slider,
			handle: handle,
			dragging: false,
			beforeStart: null,
			userModified: false,
			mouseMoved: false
		});

		if ( cType == "select" ) {

			slider.wrapInner( "<div class='ui-slider-inneroffset'></div>" );
			
			// make the handle move with a smooth transition
			handle.addClass( "ui-slider-handle-snapping" );

			options = control.find( "option" );

			control.find( "option" ).each(function( i ) {

				var side = !i ? "b":"a",
					corners = !i ? "right" :"left",
					theme = !i ? " ui-btn-down-" + trackTheme :( " " + $.mobile.activeBtnClass );

				$( "<div class='ui-slider-labelbg ui-slider-labelbg-" + side + theme + " ui-btn-corner-" + corners + "'></div>" )
					.prependTo( slider );

				$( "<span class='ui-slider-label ui-slider-label-" + side + theme + " ui-btn-corner-" + corners + "' role='img'>" + $( this ).getEncodedText() + "</span>" )
					.prependTo( handle );
			});

		}

		label.addClass( "ui-slider" );

		// monitor the input for updated values
		control.addClass( cType === "input" ? "ui-slider-input" : "ui-slider-switch" )
			.change( function() {
				
				
				
				// if the user dragged the handle, the "change" event was triggered from inside refresh(); don't call refresh() again
				if (!self.mouseMoved) {
					
					self.refresh( val(),step, true );
				}
			})
			.keyup( function() { // necessary?
				self.refresh( val(),step, true, true );
			})
			.blur( function() {
				self.refresh( val(),step, true );
			});

		// prevent screen drag when slider activated
		$( document ).bind( "vmousemove", function( event ) {
			if ( self.dragging ) {
				// self.mouseMoved must be updated before refresh() because it will be used in the control "change" event
				self.mouseMoved = true;
				
				if ( cType === "select" ) {
					// make the handle move in sync with the mouse
					handle.removeClass( "ui-slider-handle-snapping" );
				}
				
				self.refresh( event,step );
				
				// only after refresh() you can calculate self.userModified
				self.userModified = self.beforeStart !== control[0].selectedIndex;
				return false;
			}
		});
		
	
		slider.bind( "vmousedown", function( event ) {
			self.dragging = true;
			self.userModified = false;
			self.mouseMoved = false;

			if ( cType === "select" ) {
				self.beforeStart = control[0].selectedIndex;
			}
	
			self.refresh( event,step );
			return false;
		});

		slider.add( document )
			.bind( "vmouseup", function() {
				if ( self.dragging ) {

					self.dragging = false;

					if ( cType === "select") {
					
						// make the handle move with a smooth transition
						handle.addClass( "ui-slider-handle-snapping" );
					
						if ( self.mouseMoved ) {
						
							// this is a drag, change the value only if user dragged enough
							if ( self.userModified ) {
								self.refresh( self.beforeStart == 0 ? 1 : 0 ,step);
							}
							else {
								self.refresh( self.beforeStart ,step);
							}
							
						}
						else {
							// this is just a click, change the value
							self.refresh( self.beforeStart == 0 ? 1 : 0 ,step);
						}
						
					}
					
					self.mouseMoved = false;
					
					return false;
				}
			});

		slider.insertAfter( control );

		// NOTE force focus on handle
		this.handle
			.bind( "vmousedown", function() {
				$( this ).focus();
			})
			.bind( "vclick", false );

		this.handle
			.bind( "keydown", function( event ) {
				var index = val();

				if ( self.options.disabled ) {
					return;
				}

				// In all cases prevent the default and mark the handle as active
				switch ( event.keyCode ) {
				 case $.mobile.keyCode.HOME:
				 case $.mobile.keyCode.END:
				 case $.mobile.keyCode.PAGE_UP:
				 case $.mobile.keyCode.PAGE_DOWN:
				 case $.mobile.keyCode.UP:
				 case $.mobile.keyCode.RIGHT:
				 case $.mobile.keyCode.DOWN:
				 case $.mobile.keyCode.LEFT:
					event.preventDefault();

					if ( !self._keySliding ) {
						self._keySliding = true;
						$( this ).addClass( "ui-state-active" );
					}
					break;
				}

				// move the slider according to the keypress
				switch ( event.keyCode ) {
				 case $.mobile.keyCode.HOME:
					self.refresh( min ,step);
					break;
				 case $.mobile.keyCode.END:
					self.refresh( max,step );
					break;
				 case $.mobile.keyCode.PAGE_UP:
				 case $.mobile.keyCode.UP:
				 case $.mobile.keyCode.RIGHT:
					self.refresh( index + step ,step);
					break;
				 case $.mobile.keyCode.PAGE_DOWN:
				 case $.mobile.keyCode.DOWN:
				 case $.mobile.keyCode.LEFT:
					self.refresh( index - step,step );
					break;
				}
			}) // remove active mark
			.keyup( function( event ) {
				if ( self._keySliding ) {
					self._keySliding = false;
					$( this ).removeClass( "ui-state-active" );
				}
			});

		this.refresh(undefined,step, undefined, true);
	},

	refresh: function( val, step, isfromControl, preventInputUpdate ) {
		
	
		if ( this.options.disabled || this.element.attr('disabled')) { 
			this.disable();
		}

		var control = this.element, percent,
			cType = control[0].nodeName.toLowerCase(),
			min = cType === "input" ? parseFloat( control.attr( "min" ) ) : 0,
			max = cType === "input" ? parseFloat( control.attr( "max" ) ) : control.find( "option" ).length - 1;
//Modify	
			sliderOrientation = control.attr( "sliderOrientation") || "horizontal";

		if ( typeof val === "object" ) {
			var data = val,
				// a slight tolerance helped get to the ends of the slider
				tol = 8;
			if(sliderOrientation == "horizontal"){	
				if ( !this.dragging ||
						data.pageX < this.slider.offset().left - tol ||
						data.pageX > this.slider.offset().left + this.slider.width() + tol ) {
					return;
				}
			}else{
				if ( !this.dragging || data.pageY < this.slider.offset().top - tol || data.pageY > this.slider.offset().top + this.slider.height() + tol ) {return;}
			}
			
			if(sliderOrientation == "horizontal"){
				percent = Math.round( ( ( data.pageX - this.slider.offset().left ) / this.slider.width() ) * 100 );
			}
			else{
				percent = Math.round( ( -(( data.pageY - this.slider.offset().top ) - this.slider.height()) / this.slider.height() ) * 100 );
			
			}
//EndModify		
		} else {
			if ( val == null ) {
				val = cType === "input" ? parseFloat( control.val() ) : control[0].selectedIndex;
			}
			percent = ( parseFloat( val ) - min ) / ( max - min ) * 100;
		}

		if ( isNaN( percent ) ) {
			return;
		}

		if ( percent < 0 ) {
			percent = 0;
		}

		if ( percent > 100 ) {
			percent = 100;
		}

		var newval = Math.round( ( percent / 100 ) * ( max - min ) ) + min;
		newval=this.steper(newval,step)
		
		
		
		if ( newval < min ) {
			newval = min;
		}

		if ( newval > max ) {
			newval = max;
		}
		
		// Flip the stack of the bg colors
		if ( percent > 60 && cType === "select" ) {
			// TODO: Dead path?
		}
//Modify		
		if(sliderOrientation == "horizontal")
		{
			this.handle.css( "left", percent + "%" );
		}
		else
		{
			this.handle.css( "top", -(percent-100) + "%" );
		}
//endModify
		
		this.handle.attr( {
				"aria-valuenow": cType === "input" ? newval : control.find( "option" ).eq( newval ).attr( "value" ),
				"aria-valuetext": cType === "input" ? newval : control.find( "option" ).eq( newval ).getEncodedText(),
				title: newval
			});

		// add/remove classes for flip toggle switch
		if ( cType === "select" ) {
			if ( newval === 0 ) {
				this.slider.addClass( "ui-slider-switch-a" )
					.removeClass( "ui-slider-switch-b" );
			} else {
				this.slider.addClass( "ui-slider-switch-b" )
					.removeClass( "ui-slider-switch-a" );
			}
		}

		if ( !preventInputUpdate ) {
			var valueChanged = false;
		
			// update control"s value
			if ( cType === "input" ) {
				valueChanged = control.val() !== newval;
				control.val(newval);
				//control.val( this.steper(newval,step) );
			
			} else {
				valueChanged = control[ 0 ].selectedIndex !== newval;
				control[ 0 ].selectedIndex = newval;
			}
			if ( !isfromControl && valueChanged ) {
				control.trigger( "change" );
			}
		}
	},

	enable: function() {
		this.element.attr( "disabled", false );
		this.slider.removeClass( "ui-disabled" ).attr( "aria-disabled", false );
		return this._setOption( "disabled", false );
	},

	disable: function() {
		this.element.attr( "disabled", true );
		this.slider.addClass( "ui-disabled" ).attr( "aria-disabled", true );
		return this._setOption( "disabled", true );
	},
	steper:function(val,step){
			
			modulo_tmp=val%step;
			result=val-modulo_tmp;
	
		return result;
	}

});
//auto self-init widgets
$( document ).bind( "pagecreate create", function( e ){
	$.mobile.slider.prototype.enhanceWithin( e.target );
});

})( jQuery );