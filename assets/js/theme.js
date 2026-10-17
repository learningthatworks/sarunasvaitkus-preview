/*---------------------------------------------------------------------------------
* 
* Template JS
* 
* Template:		RED - Responsive One/Multi Page HTML5 Website Template
* Author: 		Themetorium
* URL:			https://themetorium.net
* 
---------------------------------------------------------------------------------*/


/* Table of Content
====================
// Detect mobile device and add class "is-mobile" to </body>
// Page preloader
// Off canvas menu
// Page header
// Parallax effect
// jQuery for page scrolling feature
// YTPlayer
// OWL Carousel
// Isotope
// Magnific Popup
// Portfolio grid
// Counter-Up
// Deferring embed videos
// Info boxes
// Forms
// uniMail
// Scroll to top button
// Miscellaneous
*/



(function ($) {
	'use strict';



	// ==========================================================
	// Detect mobile device and add class "is-mobile" to </body>
	// ==========================================================

	// Detect mobile device (Do not remove!!!)
	var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Nokia|Opera Mini/i.test(navigator.userAgent) ? true : false;

	// Add class "is-mobile" to </body>
	if(isMobile) {
		$("body").addClass("is-mobile");
	}



	// =============================================================
	// Page preloader (display loading animation while page loads)
	// =============================================================

	// Wait for window load
	$(window).on('load', function () {
		// Animate loader off screen
		$("#preloader").fadeOut("slow");
	});



	// ===================================================================================
	// Off canvas menu (source: http://codyhouse.co/gem/secondary-expandable-navigation/)
	// ===================================================================================

	var $lateral_menu_trigger = $('#cd-menu-trigger'),
	$content_wrapper = $('#body-content'),
	$navigation = $('header');

	// open-close lateral menu clicking on the menu icon.
	$lateral_menu_trigger.on('click', function(event){
		event.preventDefault();

		$lateral_menu_trigger.toggleClass('is-clicked');
		$navigation.toggleClass('lateral-menu-is-open');
		$content_wrapper.toggleClass('lateral-menu-is-open');
		$('#cd-lateral-nav').toggleClass('lateral-menu-is-open');
	});

	// close lateral menu clicking outside the menu itself.
	$content_wrapper.on('click', function(event){
		if( !$(event.target).is('#cd-menu-trigger, #cd-menu-trigger span') ) {

			$lateral_menu_trigger.removeClass('is-clicked');
			$navigation.removeClass('lateral-menu-is-open');
			$content_wrapper.removeClass('lateral-menu-is-open');
			$('#cd-lateral-nav').removeClass('lateral-menu-is-open');

		}
	});

	// close lateral menu clicking on link if class "page-scroll" exist.
	$(".cd-navigation > li > a.page-scroll").on('click', function (e) {
		$lateral_menu_trigger.removeClass('is-clicked');
		$navigation.removeClass('lateral-menu-is-open');
		$content_wrapper.removeClass('lateral-menu-is-open');
		$('#cd-lateral-nav').removeClass('lateral-menu-is-open');

		e.stopPropagation();
	});

	// open (or close) submenu items in the lateral menu. Close all the other open submenu items.
	$('.item-has-children').children('a').on('click', function(event){
		event.preventDefault();
		$(this).toggleClass('submenu-open').next('.sub-menu').slideToggle(200).end().parent('.item-has-children').siblings('.item-has-children').children('a').removeClass('submenu-open').next('.sub-menu').slideUp(200);
	});



	// ===============================
	// Page header
	// ===============================

	// if .page-header-caption contains class "ph-cap-light" add class "ph-cap-light-on" to <body>.
	if ($('.page-header-caption').hasClass('ph-cap-light')) {
		$('body').addClass('ph-cap-light-on');
	}



	// ==================================================
	// Parallax effect (for page header and intro only!)
	// ==================================================

	// Parallax scrolling (no effect on touch devices!)
	if(!isMobile) {

		// Parallax scrolling effect (transform) 
		$(window).on("scroll",function() {
			var plxScroll = $(this).scrollTop();

			$('.parallax-1').css('transform', 'translate3d(0, '+ ((plxScroll * 0.1)) +'px, 0)');
			$('.parallax-2').css('transform', 'translate3d(0, '+ ((plxScroll * 0.2)) +'px, 0)');
			$('.parallax-3').css('transform', 'translate3d(0, '+ ((plxScroll * 0.3)) +'px, 0)');
			$('.parallax-4').css('transform', 'translate3d(0, '+ ((plxScroll * 0.4)) +'px, 0)');
			$('.parallax-5').css('transform', 'translate3d(0, '+ ((plxScroll * 0.5)) +'px, 0)');
			$('.parallax-6').css('transform', 'translate3d(0, '+ ((plxScroll * 0.6)) +'px, 0)');
			$('.parallax-7').css('transform', 'translate3d(0, '+ ((plxScroll * 0.7)) +'px, 0)');
			$('.parallax-8').css('transform', 'translate3d(0, '+ ((plxScroll * 0.8)) +'px, 0)');
		});

		// Element fade out scrolling effect
		$(window).on("scroll",function() {
			$(".fade-out-scroll-1").css("opacity", 1 - $(window).scrollTop() / 150);
			$(".fade-out-scroll-2").css("opacity", 1 - $(window).scrollTop() / 250);
			$(".fade-out-scroll-3").css("opacity", 1 - $(window).scrollTop() / 350);
			$(".fade-out-scroll-4").css("opacity", 1 - $(window).scrollTop() / 450);
			$(".fade-out-scroll-5").css("opacity", 1 - $(window).scrollTop() / 550);
			$(".fade-out-scroll-6").css("opacity", 1 - $(window).scrollTop() / 650);
			$(".fade-out-scroll-7").css("opacity", 1 - $(window).scrollTop() / 750);
			$(".fade-out-scroll-8").css("opacity", 1 - $(window).scrollTop() / 850);
		});
	}



	// ==================================================================
	// jQuery for page scrolling feature - requires jQuery Easing plugin
	// ==================================================================

	$('.page-scroll').bind('click', function(event) {
		var $anchor = $(this);
		$('html, body').stop().animate({
			scrollTop: $($anchor.attr('href')).offset().top -14
		}, 1500, 'easeInOutExpo');
		event.preventDefault();
	});



	// ===========================================================================
	// YTPlayer (BG Youtube video): https://github.com/pupunzi/jquery.mb.YTPlayer
	// ===========================================================================

	$(".youtube-bg").mb_YTPlayer();
	


	// =====================================================
	// OWL Carousel
	// More info: https://owlcarousel2.github.io/OwlCarousel2/
	// Note: "animate.css" library is required: https://daneden.github.io/animate.css/
	// =====================================================

	$(window).on('load', function() {
		
		$('.owl-carousel').each(function() {
			var $carousel = $(this);
			$carousel.owlCarousel({

				items: $carousel.data("items"),
				loop: $carousel.data("loop"),
				margin: $carousel.data("margin"),
				startPosition: $carousel.data("start-position"),
				animateIn: $carousel.data("animate-in"),
				animateOut: $carousel.data("animate-out"),
				autoHeight: $carousel.data("autoheight"),
				autoplay: $carousel.data("autoplay"),
				autoplayTimeout: $carousel.data("autoplay-timeout"),
				autoplayHoverPause: $carousel.data("autoplay-hover-pause"),
				autoplaySpeed: $carousel.data("autoplay-speed"),
				nav: $carousel.data("nav"),
				navText: ['', ''],
				navSpeed: $carousel.data("nav-speed"),
				dots: $carousel.data("dots"),
				dotsSpeed: $carousel.data("dots-speed"),
				mouseDrag: $carousel.data("mouse-drag"),
				touchDrag: $carousel.data("touch-drag"),
				dragEndSpeed: $carousel.data("drag-end-speed"),
				lazyLoad: $carousel.data("lazy-load"),
				video: true,
				onLoadLazy: owlLazyLoading,
				onLoadedLazy: owlLazyLoaded,
				responsive: {
					0: {
						items: $carousel.data("mobile-portrait"),
					},
					480: {
						items: $carousel.data("mobile-landscape"),
					},
					768: {
						items: $carousel.data("tablet-portrait"),
					},
					992: {
						items: $carousel.data("tablet-landscape"),
					},
					1200: {
						items: $carousel.data("items"),
					}
				}

			});

		});


		// Mousewheel plugin
		var owlMouse = $('.owl-mousewheel');
		owlMouse.on('mousewheel', '.owl-stage', function (e) {
			if (e.deltaY > 0) {
				owlMouse.trigger('prev.owl', [800]);
			} else {
				owlMouse.trigger('next.owl', [800]);
			}
			e.preventDefault();
		});
		

		// Keyboard (prev/next arrow) events for navigating
		// https://github.com/OwlCarousel2/OwlCarousel2/issues/492#issuecomment-55629470
		var owlKeyboard = $('.owl-carousel');
		$(document).keyup(function(i){
			if(i.keyCode==37) {
				owlKeyboard.trigger('prev.owl', [800]);
			} else if (i.keyCode==39) {
				owlKeyboard.trigger('next.owl', [800]);
			}
		});


		// Add owl lazy loader to ".owl-lazy" element (for background images only!).
		// ===========================================
		$('.owl-lazy').each(function() {
			var owlLazy = $(this);
			if ($(owlLazy).hasClass('bg-image')) {
				// add wrap element to ".owl-lazy".
				$(owlLazy).wrap('<div class="owl-lazy-wrap" />');
				// add lazy loader to parent element.
				$(owlLazy).parent().prepend('<div class="owl-lazy-loader"></div>');
			}
		});

		// Owl Callbacks for lazy loader
		function owlLazyLoading(event) {
			$('.owl-lazy-loader').each(function() {
				$(this).addClass('owl-lazy-loading');
			});
		}
		function owlLazyLoaded(event) {
			$('.owl-lazy-loader').each(function() {
				$(this).removeClass('owl-lazy-loading');
			});
		}

	});



	// ===================================================================================
   // Isotope
   // More info: http://isotope.metafizzy.co
   // Note: "imagesloaded" blugin is required: https://github.com/desandro/imagesloaded
   // ===================================================================================

   // Portfolio sort: newest first (reads Date: from popup or data-sort-year on item)
   function parsePortfolioSortYear(itemElem) {
      var $item = $(itemElem);
      var attr = $item.attr('data-sort-year');
      if (attr) return parseInt(attr, 10) || 0;
      var dateText = '';
      $item.find('.pgi-popup li').each(function() {
         var t = $(this).text().replace(/\s+/g, ' ').trim();
         if (t.indexOf('Date:') === 0) dateText = t;
      });
      var years = dateText.match(/\d{4}/g);
      if (!years || !years.length) return 0;
      return Math.max.apply(null, years.map(function(y) { return parseInt(y, 10); }));
   }

   var portfolioIsotopeOptions = {
      itemSelector: '.isotope-item',
      transitionDuration: '0.7s',
      masonry: {
         columnWidth: '.isotope-grid-sizer',
         horizontalOrder: false
      },
      getSortData: {
         sortValue: function(itemElem) {
            var year = parsePortfolioSortYear(itemElem);
            var tie = parseInt(itemElem.getAttribute('data-sort-tie') || '0', 10);
            return (year * 100) + tie;
         }
      },
      sortBy: 'sortValue',
      sortAscending: false
   };

   // init Isotope
   var $container = $('.isotope-items-wrap');
   if ($container.length) {
      $container.find('.isotope-item').each(function(index) {
         if (!this.getAttribute('data-sort-tie')) {
            this.setAttribute('data-sort-tie', index);
         }
      });

      $container.imagesLoaded(function() {
         $container.isotope(portfolioIsotopeOptions);
      });

      // Filter (keep newest-first sort when category changes)
      $('.isotope-filter-links button').on("click", function() {
         var selector = $(this).attr('data-filter');
         $container.isotope($.extend({}, portfolioIsotopeOptions, { filter: selector }));
         return false;
      });

      // Filter item active
      var filterItemActive = $('.isotope-filter-links button');
      filterItemActive.on('click', function(){
         var $this = $(this);
         if ( !$this.hasClass('active')) {
            filterItemActive.removeClass('active');
            $this.addClass('active');
         }
      });
   }

   // if "isotope-items-wrap" exist.
	if ($('.isotope-items-wrap').length){
		
		// add overflow scroll to <html> (isotope items gaps fix).
		if ( document.querySelector('body').offsetHeight > window.innerHeight ) {
			document.documentElement.style.overflowY = 'scroll';
		}
	}



	// ==============================================================
	// Magnific Popup: http://dimsemenov.com/plugins/magnific-popup/
	// ==============================================================

	// Image gallery popup (type image)
	$('.popup-gallery').magnificPopup({
		delegate: '.popup-trigger',
		type: 'image',
		tLoading: 'Loading image #%curr%...',
		mainClass: 'mfp-fadein',
		gallery: {
			enabled: true, // enable or disable gallery (false/true)
			preload: [0,1], // read about this option in next Lazy-loading section
			navigateByImgClick: true,
			arrowMarkup: '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>', // markup of an arrow button
			tPrev: 'Previous (Left arrow key)', // title for left button
			tNext: 'Next (Right arrow key)', // title for right button
			tCounter: '<span class="mfp-counter">%curr% of %total%</span>' // markup of counter
		},
		image: {
			titleSrc: 'data-title', // Attribute of the target element that contains caption for the slide.
			tError: '<a href="%url%">The image #%curr%</a> could not be loaded.' // Error message
		}
	});

	// Image gallery popup for OWL Carousel (type image)
	$('.owl-popup-gallery').magnificPopup({
		delegate: '.owl-item:not(.cloned) .owl-popup-trigger',
		type: 'image',
		tLoading: 'Loading image #%curr%...',
		mainClass: 'mfp-fadein',
		gallery: {
			enabled: true, // enable or disable gallery (false/true)
			preload: [0,1], // read about this option in next Lazy-loading section
			navigateByImgClick: true,
			arrowMarkup: '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>', // markup of an arrow button
			tPrev: 'Previous (Left arrow key)', // title for left button
			tNext: 'Next (Right arrow key)', // title for right button
			tCounter: '<span class="mfp-counter">%curr% of %total%</span>' // markup of counter
		},
		image: {
			titleSrc: 'data-title', // Attribute of the target element that contains caption for the slide.
			tError: '<a href="%url%">The image #%curr%</a> could not be loaded.' // Error message
		}
	});

	// Inline popup (iframe)
	$('.popup-iframe').magnificPopup({
		disableOn: 768,
		type: 'iframe',
		mainClass: 'mfp-fadein',
		removalDelay: 160,
		preloader: false,
		fixedContentPos: false,
		gallery: {
			enabled: false, // enable or disable gallery (false/true)
			arrowMarkup: '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>', // markup of an arrow button
			tPrev: 'Previous (Left arrow key)', // title for left button
			tNext: 'Next (Right arrow key)' // title for right button
		}
	});

	var YOUTUBE_EMBED_ALLOW =
		'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; compute-pressure';

	function applyYoutubeEmbedAllow(iframe) {
		var src = iframe.getAttribute('src') || iframe.getAttribute('data-src') || '';
		if (!/youtube\.com|youtube-nocookie\.com|youtu\.be/i.test(src)) {
			return;
		}
		iframe.setAttribute('allow', YOUTUBE_EMBED_ALLOW);
		iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
		iframe.setAttribute('allowfullscreen', '');
	}

	function initYoutubeEmbedPolicy() {
		document.querySelectorAll('iframe').forEach(function (iframe) {
			applyYoutubeEmbedAllow(iframe);
		});
	}

	// Portfolio modal iframes: defer until popup is open (hidden panels break embeds).
	function preparePortfolioMediaIframes() {
		$('.inline-popup').find('iframe.portfolio-media-frame, iframe.embed-responsive-item').each(function() {
			var src = this.getAttribute('data-src') || this.getAttribute('src') || '';
			if (!src || src === 'about:blank') {
				return;
			}
			this.setAttribute('data-src', src);
			this.setAttribute('src', 'about:blank');
			if (/^demo\//i.test(src)) {
				this.classList.add('portfolio-demo-iframe');
				$(this).closest('.ratio, .embed-responsive').addClass('portfolio-demo-frame');
			}
			applyYoutubeEmbedAllow(this);
		});
	}

	initYoutubeEmbedPolicy();
	preparePortfolioMediaIframes();

	function activatePortfolioMediaIframes($root) {
		var $scope = $root && $root.length ? $root : $('.mfp-content');

		$scope.find('iframe.portfolio-media-frame, iframe.embed-responsive-item, iframe.portfolio-demo-iframe').each(function() {
			var iframe = this;
			var src = iframe.getAttribute('data-src');
			if (!src || src === 'about:blank') {
				return;
			}
			applyYoutubeEmbedAllow(iframe);
			iframe.setAttribute('src', 'about:blank');
			window.requestAnimationFrame(function() {
				window.requestAnimationFrame(function() {
					iframe.setAttribute('src', src);
				});
			});
		});
	}

	function resetPortfolioMediaIframes($root) {
		$root.find('iframe.portfolio-media-frame, iframe.embed-responsive-item, iframe.portfolio-demo-iframe').each(function() {
			if (this.getAttribute('data-src')) {
				this.setAttribute('src', 'about:blank');
			}
		});
	}

	window.dtActivatePopupMedia = function ($root) {
		activatePortfolioMediaIframes($root ? $($root) : null);
	};

	// Inline popup (type inline)
	function isCompactPopupViewport() {
		return window.matchMedia('(max-width: 768px), (max-height: 520px)').matches;
	}

	function refreshInlinePopupLayout() {
		var instance = $.magnificPopup.instance;
		if (instance && typeof instance.updateSize === 'function') {
			instance.updateSize();
		}
	}

	var popupLayoutTimer;

	function measurePopupTextHeight($popup) {
		var $row = $popup.find('.inline-popup-inner > .row').first();
		if (!$row.length) {
			return 160;
		}
		var stacked = window.innerWidth < 768;
		var textH = 0;
		$row.children('[class*="col-"]').each(function() {
			var $col = $(this);
			if ($col.find('.ratio, .embed-responsive').length) {
				return;
			}
			var colH = $col.outerHeight(true) || 0;
			textH = stacked ? textH + colH : Math.max(textH, colH);
		});
		return textH;
	}

	function layoutPortfolioPopup($popup) {
		if (!$popup || !$popup.length) {
			return;
		}

		var el = $popup[0];
		var vh = window.innerHeight;
		var vw = window.innerWidth;
		var maxPopupH = Math.min(vh * 0.9, 900);
		var maxPopupW = Math.min(1100, vw - 24);

		el.style.setProperty('--popup-max-w', maxPopupW + 'px');
		el.style.setProperty('--popup-max-h', maxPopupH + 'px');

		var $copy = $popup.find('.inline-popup-inner p, .inline-popup-inner li');
		var textChars = $copy.text().replace(/\s+/g, ' ').trim().length;
		var pCount = $popup.find('.inline-popup-inner p').length;
		var isLite = textChars < 520 && pCount <= 3;

		$popup.removeClass('popup-text-lite popup-text-heavy')
			.addClass(isLite ? 'popup-text-lite' : 'popup-text-heavy');

		var textH = measurePopupTextHeight($popup);
		var chrome = 56;
		var availableDemo = maxPopupH - textH - chrome;
		var minDemo = isLite ? 200 : 160;
		var capDemo = isLite ? Math.min(vh * 0.62, 600) : Math.min(vh * 0.5, 480);
		var demoH = Math.max(minDemo, Math.min(availableDemo, capDemo));

		el.style.setProperty('--popup-text-h', Math.round(textH) + 'px');
		el.style.setProperty('--popup-demo-max-h', Math.round(demoH) + 'px');

		refreshInlinePopupLayout();
	}

	function schedulePortfolioPopupLayout($popup) {
		clearTimeout(popupLayoutTimer);
		popupLayoutTimer = setTimeout(function() {
			layoutPortfolioPopup($popup);
		}, 60);
	}

	$('.inline-popup-trigger').magnificPopup({
		type: 'inline',
		modal: false,
		alignTop: false,
		fixedContentPos: true,
		fixedBgPos: false,
		overflowY: 'auto',
		closeBtnInside: true,
		preloader: false,
		midClick: true,
		removalDelay: 300,
		mainClass: 'mfp-fade-zoom mfp-popup-centered' + (isCompactPopupViewport() ? ' mfp-popup-compact' : ''),
		gallery: {
			enabled: false, // enable or disable gallery (false/true)
			arrowMarkup: '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>', // markup of an arrow button
			tPrev: 'Previous (Left arrow key)', // title for left button
			tNext: 'Next (Right arrow key)' // title for next button
		},
		callbacks: {
			beforeOpen: function() {
				this.st.mainClass = 'mfp-fade-zoom mfp-popup-centered' + (isCompactPopupViewport() ? ' mfp-popup-compact' : '');
			},
			open: function() {
				var $content = this.content instanceof jQuery ? this.content : $(this.content);
				$content.removeClass('mfp-hide');
				var activateDelay = isCompactPopupViewport() ? 40 : 80;
				var runLayout = function() {
					schedulePortfolioPopupLayout($content);
				};
				var loadMedia = function() {
					activatePortfolioMediaIframes($content);
				};
				setTimeout(function() {
					loadMedia();
					runLayout();
				}, activateDelay);
				setTimeout(loadMedia, 280);
				setTimeout(function() {
					loadMedia();
					runLayout();
				}, 550);
				$(window).on('resize.inlinePopup', runLayout);
			},
			close: function() {
				$(window).off('resize.inlinePopup');
				clearTimeout(popupLayoutTimer);
				var $content = this.content instanceof jQuery ? this.content : $(this.content);
				$content.removeClass('popup-text-lite popup-text-heavy');
				resetPortfolioMediaIframes($content);
			}
		}
	});

	$(document).on('click', '.inline-popup-close', function (e) {
		e.preventDefault();
		$.magnificPopup.close();
	});



	// =====================
	// Portfolio grid
	// =====================

	// If "pgi-image-ghost" exist add class "cover-opacity-*" to "pgi-image-wrap".
	$('.pgi-image-wrap').each( function() {
		if ($(this).find(".pgi-image-ghost").length ) {
			$(this).addClass("cover-opacity-6");
		}
	});



	// ========================================================================================
	// Counter-Up (requires jQuery waypoints.js plugin): https://github.com/bfintal/Counter-Up
	// ========================================================================================

	$('.counter').counterUp({
		delay: 10,
		time: 2000
	});



	// ============================================================================================
	//
	// Deferring embed videos (Youtube, Vimeo).
	// 
	// When you have videos from Youtube, Vimeo or just about any other provider embedded 
	// in your webpages it causes your page to load slower. Just about every video can be deferred 
	// until after your initial pageload which will allow your page to load quickly 
	// without having to gather all the files and resources that the video is requesting.
	//
	// More info: https://www.feedthebot.com/pagespeed/defer-videos.html
	//
	// ============================================================================================

	function init() {
	var vidDefer = document.getElementsByTagName('iframe');
	for (var i=0; i<vidDefer.length; i++) {
	if(vidDefer[i].getAttribute('data-src') && !vidDefer[i].closest('.inline-popup')) {
		vidDefer[i].setAttribute('src',vidDefer[i].getAttribute('data-src'));
	} } }
	window.onload = init;



	// =====================
	// Info boxes
	// =====================

	if ($(".info-box-wrap").hasClass("ib-alter-2")) {
		$(".info-box").each( function() {
			var $aaa = $(this).find(".info-box-heading");
			var $bbb = $(this).find(".info-box-info");

			$aaa.prependTo($bbb);
		});
	}



	// ================================================================
	// Forms
	// ================================================================

	// Bootstrap forms validation
	// ===========================
	window.addEventListener('load', function() {
		// Fetch all the forms we want to apply custom Bootstrap validation styles to
		var forms = document.getElementsByClassName('needs-validation');
		// Loop over them and prevent submission
		var validation = Array.prototype.filter.call(forms, function(form) {
			form.addEventListener('submit', function(event) {
				if (form.checkValidity() === false) {
					event.preventDefault();
					event.stopPropagation();
				}
				form.classList.add('was-validated');
			}, false);
		});
	}, false);


	// Remove input placeholder on focus
	// ==================================
	$("input,textarea").focus(function () {
		$(this).data("placeholder", $(this).attr("placeholder"))
			.attr("placeholder", "");
	}).blur(function () {
		$(this).attr("placeholder", $(this).data("placeholder"));
	}); 


	// Form "Browse File" button info
	// ===============================
	$(document).on("change", ":file", function() {
		var input = $(this),
		numFiles = input.get(0).files ? input.get(0).files.length : 1,
		label = input.val().replace(/\\/g, "/").replace(/.*\//, "");
		input.trigger("fileselect", [numFiles, label]);
	});
	$(":file").on("fileselect", function(event, numFiles, label) {
		var input = $(this).parents(".custom-file").find(".custom-file-info"),
		log = numFiles > 1 ? numFiles + " files selected" : label;

		if( input.length ) {
			input.val(log);
		} else {
			if( log ) alert(log);
		}
	});



	// ===============================================
	// uniMail - Universal PHP Mail Feedback Script
	// Source: https://github.com/agragregra/uniMail
	// ===============================================

	$(document).ready(function() {

		// E-mail Ajax Send
		$("#contact-form").submit(function() { // your contact form ID.
			var th = $(this);
			$.ajax({
				type: "POST",
				url: "mail.php", // mail.php path (do not remove this file!!!).
				data: th.serialize()
			}).done(function() {
				alert("Thank you. Your message has been sent!");
				setTimeout(function() {
				// Done Functions
				th.trigger("reset");
				}, 1000);
			});
			return false;
		});

	});



	// =====================
	// Scroll to top button
	// =====================

	// Check to see if the window is top if not then display button
	$(window).scroll(function(){
		if ($(this).scrollTop() > 800) {
			$('.scrolltotop').fadeIn();
		} else {
			$('.scrolltotop').fadeOut();
		}
	});

	// Click event to scroll to top
	$('.scrolltotop').on('click', function () {
		$('html, body').animate({scrollTop : 0}, 1500, 'easeInOutExpo');
		return false;
	});



	// ===============
	// Miscellaneous
	// ===============

	// if "tt-sidebar" exist.
	if ($('.tt-sidebar').length){
		$("body").addClass("tt-sidebar-on");
	}

	// Bootstrap tooltip/popover (BS5 getOrCreateInstance when available, else jQuery plugin)
	// ==========================================================================
	function initBootstrapTooltipsAndPopovers() {
		var bs = window.bootstrap;
		var tooltipSelector = '[data-bs-toggle="tooltip"], [data-toggle="tooltip"]';
		var popoverSelector = '[data-bs-toggle="popover"], [data-toggle="popover"]';

		if (bs && bs.Tooltip && typeof bs.Tooltip.getOrCreateInstance === 'function') {
			document.querySelectorAll(tooltipSelector).forEach(function (element) {
				bs.Tooltip.getOrCreateInstance(element);
			});
		} else if ($.fn.tooltip) {
			$(tooltipSelector).tooltip();
		}

		if (bs && bs.Popover && typeof bs.Popover.getOrCreateInstance === 'function') {
			document.querySelectorAll(popoverSelector).forEach(function (element) {
				bs.Popover.getOrCreateInstance(element);
			});
		} else if ($.fn.popover) {
			$(popoverSelector).popover();
		}
	}

	$(initBootstrapTooltipsAndPopovers);

	// Accordion embed videos — load only when panel + collapse are visible
	// ==========================================================================
	function loadAccordionEmbedVideos(root) {
		var scope = root || document;
		scope.querySelectorAll('.tt-accordion-item-body iframe.accordion-embed-video, .tt-accordion-item-body iframe[data-embed-src]').forEach(function (iframe) {
			var src = iframe.getAttribute('data-embed-src') || iframe.getAttribute('data-src');
			if (!src || iframe.getAttribute('src')) {
				return;
			}
			applyYoutubeEmbedAllow(iframe);
			iframe.setAttribute('src', src);
		});
	}

	function initAccordionEmbedVideos() {
		var accordion = document.getElementById('tt-accordion-example');
		if (!accordion) {
			return;
		}

		accordion.querySelectorAll('.collapse').forEach(function (collapseEl) {
			collapseEl.addEventListener('shown.bs.collapse', function () {
				loadAccordionEmbedVideos(collapseEl);
			});
		});

		var whatPanel = document.getElementById('What');
		var refreshWhatAccordionVideos = function () {
			if (!whatPanel || !whatPanel.classList.contains('active')) {
				return;
			}
			accordion.querySelectorAll('.collapse.show').forEach(function (collapseEl) {
				loadAccordionEmbedVideos(collapseEl);
			});
		};

		if (whatPanel) {
			new MutationObserver(refreshWhatAccordionVideos).observe(whatPanel, {
				attributes: true,
				attributeFilter: ['class']
			});
			refreshWhatAccordionVideos();
		}

		window.dtLoadAccordionVideos = refreshWhatAccordionVideos;
	}

	// Accordion / collapse (#What section and any data-bs-toggle="collapse" triggers)
	// ==========================================================================
	function initBootstrapCollapses() {
		var bs = window.bootstrap;
		var accordion = document.getElementById('tt-accordion-example');
		if (!accordion) {
			return;
		}

		accordion.querySelectorAll('[data-bs-toggle="collapse"], [data-toggle="collapse"]').forEach(function (button) {
			button.addEventListener('click', function (event) {
				event.preventDefault();
				event.stopPropagation();

				var selector = button.getAttribute('data-bs-target') || button.getAttribute('data-target') || button.getAttribute('href');
				if (!selector || selector === '#') {
					return;
				}

				var collapseEl = document.querySelector(selector);
				if (!collapseEl) {
					return;
				}

				var afterShow = function () {
					loadAccordionEmbedVideos(collapseEl);
				};
				collapseEl.addEventListener('shown.bs.collapse', afterShow, { once: true });

				if (bs && bs.Collapse && typeof bs.Collapse.getOrCreateInstance === 'function') {
					bs.Collapse.getOrCreateInstance(collapseEl, { parent: accordion }).toggle();
				} else if ($.fn.collapse) {
					$(collapseEl).collapse('toggle');
				}

				setTimeout(function () {
					if (collapseEl.classList.contains('show')) {
						loadAccordionEmbedVideos(collapseEl);
					}
				}, 450);
			});
		});
	}

	$(function () {
		initAccordionEmbedVideos();
		initBootstrapCollapses();
	});


	// Bootstrap-3 modal fix
	// =============================
	$('.modal').appendTo("body");


	// Hover fix for iOS
	// =============================
	$('*').on('touchstart',function() {
		$(this).trigger('hover');
	}).on('touchend',function() {
		$(this).trigger('hover');
	});


})(jQuery); 

// ---------------------
// :: Google Map
// ---------------------

//function initialize() {
//    var mapOptions = {
//        zoom: 15,
//        scrollwheel: false,
//        center: new google.maps.LatLng(50.997318, -0.103110)
//    };
//    var map = new google.maps.Map(document.getElementById('googleMap'),
//        mapOptions);
//    var marker = new google.maps.Marker({
//        position: map.getCenter(),
//        animation: google.maps.Animation.BOUNCE,
//        icon: 'img/map-marker.png',
//        map: map,
//    });
//
//}
//google.maps.event.addDomListener(window, 'load', initialize);