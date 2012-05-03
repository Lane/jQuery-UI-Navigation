/** 
Dropdown
---------------------------------------------------------------------
Author:         Lane Olson
Version:        1.1
Date:           May 2, 2012
Description:    Displays a list of links as a dropdown menu
---------------------------------------------------------------------
**/

;(function ( $, window, document, undefined ) {

    $.widget( "navigation.dropdown" , {

        //Options to be used as defaults
        options: {
            linkText: 'Navigation', // Wording for collapsed menu
            htmlArrowMore: '&#x25BC;', // html to represent more arrow
            htmlArrowLess: '&#x25B2;', // html to represent less arrow
            bindOn: 'click',  // what event to trigger the subnav ('click' or 'hover')
            showLinksByDefault: false // display navigation links by default
        },

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {
            var self = this;
            
            // List containing the links
            this.list = this.element.children(); //sub nav
            
            // Wrap existing list in another list
            this.listWrapper = this.list.wrap('<ul><li></li></ul>');
            
            this.isAnimating = false;
            
            // Add the show/hide link (linkEl)
            this.toggleLink = $('<a class="'+this.widgetBaseClass+'-toggle" href="#">'+this.options.linkText+'</a>')
                .insertBefore(this.list)
                .append('<strong>'+ this.options.htmlArrowMore +'</strong>');
            
            // Hide dropdown if not visible by default
            if(!this.options.showLinksByDefault)
                this.list.hide();
            
            if(this.options.bindOn == 'click')
            {
                $('html').click(function() { self.hide(); }); // hide dropdown on click outside of menu
                this.list.parent().bind('click.dropdown', $.proxy(this, "_click"));
            } else {
                this.list.parent().bind('mouseenter.dropdown mouseleave.dropdown', $.proxy(this, "_hover"));
            }
        },

        _hover: function(e) {
			(e.type == "mouseenter" ? this.show() : this.hide());
			this._trigger("hover", e, {
				hovered: $(e.target)
			});
		},
		
		_click: function(e) {
		    e.stopPropagation();
		    (this.list.is(":hidden") ? this.show() : this.hide());
		    this._trigger("click", e, {
		        clicked: $(e.target)
		    });
		},
		
		hide: function() {
		    this.element.addClass(this.widgetBaseClass+"-closed")
		        .removeClass(this.widgetBaseClass+"-open");
		    this.list.slideUp("fast");
		    $('strong', this.toggleLink).html(this.options.htmlArrowMore);
		},
		
		show: function() {
		    this.element.addClass(this.widgetBaseClass+"-open")
		        .removeClass(this.widgetBaseClass+"-closed");
		    this.list.slideDown("fast");
		    $('strong', this.toggleLink).html(this.options.htmlArrowLess);
		},
		
        destroy: function () {
        
            // remove from wrapper
            this.element.html(this.list);
            
            // remove any inline styling
            $('ul', this.element).removeAttr('style');
            
            // unbind events
            this.list.parent().unbind();

            $.Widget.prototype.destroy.call(this);
        }
    });


    $.widget( "navigation.slidernav" , {

        //Options to be used as defaults
        options: {
            transitionTime: 200,
            backWording: "Back to",
            moreArrow: "&#x25B6;",
            prevArrow: "&#x25C0;"
        },

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {
            var self = this;
            this.element.css('overflow', 'hidden');
            this.topLevel = this.element.find("ul:first");
            this.currentNav = this.topLevel;
            
            this.currentNav.addClass(this.widgetBaseClass+'-current');
            
            $('ul', this.element).css({ 
                'position': 'absolute', 
                'width': '100%', 
                'top': '0px' 
            });
            
            this.element.css('height', this.topLevel.height());
            
            $("li", this.topLevel).each(function() {
                if($(this).children("ul").length > 0 || $(this).children('div').children('ul').length > 0)
                {
                    $(this).children("ul","div").addClass(self.widgetBaseClass+'-right');
                    $(this).children("a").append('<strong>'+self.options.moreArrow+'</strong>').addClass(self.widgetBaseClass+'-more');
                }
            });
        
            this.element.on("click", "a."+self.widgetBaseClass+'-more', function() {
                self.slideTo($(this));
                return false;
            });
            
            this.element.on("click", "a."+self.widgetBaseClass+'-back', function () {
                self.slideBack();
                return false;
            });
        },
        
        slideTo: function(item) {
			var currUl = this.currentNav;
			var nextUl = item.siblings("ul:first");
			var divContainer = false;

            if(!this.isAnimating)
			{
                this.isAnimating = true;
                if(nextUl.length < 1)
                {
                    divContainer = item.siblings("div");
                    nextUl = $("ul:first", divContainer);
                }
                
                nextUl.prepend('<li><a class="'+this.widgetBaseClass+'-back'+'" href="#">'+this.options.backWording+' '+item.html()+'</a></li>');
                $('a.'+this.widgetBaseClass+'-back'+' strong', nextUl).html(this.options.prevArrow);

                if(!this.transitionSupport())
                {
                    nextUl.css("left", nextUl.position().left+"px");
                    nextUl.animate({ left: "0" }, this.options.transitionTime, "linear", function()
                    {
                        this.switchClassesNext(currUl, nextUl);
                        this.isAnimating = false;
                    });
			    } else {
				    this.switchClassesNext(currUl, nextUl);
                    this.isAnimating = false;
			    }
			    this.currentNav = nextUl;
            }
        },
        
        slideBack: function() {
			var currUl = this.currentNav;
			var prevUl = currUl.parents("ul:first"); // get first parent <ul>
			var moveLeft; // value to animate left to
			
            if(!this.isAnimating) {
                this.isAnimating = true;
                if(!this.transitionSupport()) {
                    if(prevUl.position().left < 0)
                        moveLeft = "0";
                    else
                        moveLeft = "100%";
                        
                    prevUl.css("left", prevUl.position().left+"px");
                    prevUl.animate({ left: moveLeft }, this.options.transitionTime, "linear", function()
                    {
                        this.switchClassesPrevious(currUl, prevUl);
                        this.isAnimating = false;
                    });
			    } else {
				    this.switchClassesPrevious(currUl, prevUl);
                    this.isAnimating = false;
			    }
			this.currentNav = prevUl;
            }
        },
        
		switchClassesNext: function(current, next) {
			current.removeClass(this.widgetBaseClass+'-current');
			current.addClass(this.widgetBaseClass+'-left');
			next.addClass(this.widgetBaseClass+'-current');
			next.removeClass(this.widgetBaseClass+'-right');
			this.element.height(next.height());
			next.css("left", "");
		},
		
		switchClassesPrevious: function(current, previous) {
			current.removeClass(this.widgetBaseClass+'-current');
			current.addClass(this.widgetBaseClass+'-right');
			previous.addClass(this.widgetBaseClass+'-current').css("left", "");
			previous.removeClass(this.widgetBaseClass+'-left').css("left", "");
			current.find("li:first").remove();
			this.element.height(previous.height());
		},
        
        transitionSupport: function() {
			var d = document.createElement("detect"),
				CSSprefix = "Webkit,Moz,O,ms,Khtml".split(","),
				All = ("transition " + CSSprefix.join("Transition,") + "Transition").split(",");
			for (var n = 0, np = All.length; n < np; n++) {
				if (d.style[All[n]] === "") {
					return true;
				}
			}
			return false;
		},

        destroy: function () {
			this.element.removeAttr('style');
			this.element.off("click", "**");
			$('.'+this.widgetBaseClass+'-current', this.element).removeClass(this.widgetBaseClass+'-current');
			$('.'+this.widgetBaseClass+'-right', this.element).removeClass(this.widgetBaseClass+'-right');
			$('.'+this.widgetBaseClass+'-left', this.element).removeClass(this.widgetBaseClass+'-left');
			$('.'+this.widgetBaseClass+'-more'+' strong', this.element).remove();
			$('.'+this.widgetBaseClass+'-more', this.element).removeClass(this.widgetBaseClass+'-more');
			$('ul', this.element).removeAttr('style');
            $('.'+this.widgetBaseClass+'-back', this.element).parent().remove();
            $.Widget.prototype.destroy.call(this);
        }
    });
    
    $.widget( "navigation.multilevel" , {

        //Options to be used as defaults
        options: {

        },

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {
            var self = this;
	    
			// hide the sub navigation
			this.hideDropdown();

			$('ul:first > li', this.element).bind("mouseenter.multilevel mouseleave.multilevel", $.proxy(this, "_hover"));
        },

        _hover: function(e) {
			(e.type == "mouseleave" ? this.hideDropdown() : this.showDropdown($(e.target)));
			this._trigger("hover", e, {
				hovered: $(e.target)
			});
		},

		
		showDropdown: function(item) {
            item.siblings().show();
		},
		
		hideDropdown: function() {
			if($('ul > li > div', this.element).length > 0) {
				$('ul > li > div', this.element).hide();
			} else {
				$('ul > li > ul', this.element).hide();
			}
		},
		
        destroy: function () {
			$('div', base.el).removeAttr('style');
			$('ul', base.el).removeAttr('style');
            $.Widget.prototype.destroy.call(this);
        }
    });

})( jQuery, window, document );