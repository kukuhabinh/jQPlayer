/**!

	jQPlayer - HTML 5 Video Player Plugin for jQuery
	Version: 0.5
	Site: http://jqplayer.vebersol.net/
	
	Author: Vinícius Ebersol
	Designer: Thiago Reis
	
	License: MIT License/GPL License
	
*/
var options;
(function ($) {

	var VideoPlayer = function (selector, options) {
		this.selector = selector;
		this.options = options;
		this.idCounter = 0;
		this.playing = false;
		this.supportHTML5 = true;
		this.init();
	};

	VideoPlayer.prototype = {
		init: function () {
			this.startFallback();
			// this.checkSupport();


			/*this.getDefaultVideo();
			this.createVideoElement();
			this.createControls();
			this.bindControls();
			this.bindEvents();
			this.setupSubtitles();

			if (this.options.onStart) {
				this.options.onStart.call();
			}*/
		},

		start: function () {
			this.getDefaultVideo();
			this.createVideoElement();
			this.createControls();
			this.bindControls();
			this.bindEvents();
			this.setupSubtitles();

			if (this.options.onStart) {
				this.options.onStart.call();
			}
		},

		startFallback: function () {
			console.log('start flash');
			if (!this.options.fallbackOptions) {
				alert('fallbackOptions not set');
				return false;
			}

			var _this = this;

			this.supportHTML5 = false;
			this.getDefaultVideo();
			this.createFlashElement();
			this.createControls();
			this.bindControls();
			this.bindEvents();
			this.setupSubtitles();
		},

		adjustSubtitle: function (video) {
			this.subtitleObj.count = 0;
			this.subtitleObj.current = this.subtitleObj.content[this.subtitleObj.count];

			var videoTime = this.supportHTML5 ? video.currentTime : video.currentTime(),
				currentTime = parseFloat(videoTime);

			while (this.getMaxTime() < currentTime) {
				this.updateSubtitle(video);

				if (this.subtitleObj.count > this.subtitleObj.content.length - 1) {
					this.subtitleObj.count = this.subtitleObj.content.length - 1;
					break;
				}
			}
		},

		bindControls: function (video) {
			var _this = this;
			
			for (var i = 0; i < this.options.controls.length; i++) {
				switch (this.options.controls[i]) {
					case 'play':
						this.selector.find(_this.getClass('play')).bind('click', function () { _this.playPause(); });
						break;
					case 'progress':
						this.setupProgressBar();
						break;
					case 'volume':
						this.selector.find(_this.getClass('volume-button')).bind('click', function () {	_this.muteVideo(); });
						break;
					case 'fullscreen':
						this.selector.find(_this.getClass('fullscreen')).bind('click', function () { _this.toFullscreen(); });
						break;
					default:
						break;
				}
			}
		},

		bindEvents: function () {
			var _this = this;
			var video = this.video.get(0);

			if (this.supportHTML5) {
				video.addEventListener('loadedmetadata', function () {
					_this.eventsToBind();				
				}, true);
				
				if ($.browser.webkit) {
					$(document).bind('webkitfullscreenchange', function () {
						_this.fullscreenEvent();
					});
				}
				else if ($.browser.mozilla) {
					$(document).bind('mozfullscreenchange', function () {
						_this.fullscreenEvent();
					});
				}
			}
			else {
				$(document).bind('flash.loaded', function () {
					_this.eventsToBind();
				});
			}
			
			var enter = function () {
				$(this).addClass('hover');
			};
			
			var leave = function () {
				$(this).removeClass('hover');
			};
			
			$(this.getClass('play')).hover(enter, leave);
			$(this.getClass('volume')).hover(enter, leave);
			$(this.getClass('fullscreen')).hover(enter, leave);
			$(this.getClass('alternative-versions')).hover(enter, leave);

			this.selector.bind('mouseleave', function (ev) {
				ev.preventDefault();
				if (_this.playing) {
					clearTimeout(_this.inactivateTimer);
					_this.inactivateTimer = setTimeout(function () {
						_this.selector.find(_this.getClass('video-controls')).addClass('inactive');
					}, 2000);
				}
			});
			
			this.selector.bind('mouseenter', function (ev) {
				ev.preventDefault();
				clearTimeout(_this.inactivateTimer);
				_this.selector.find(_this.getClass('video-controls')).removeClass('inactive');
			});
		},
		
		blockSelection: function () {
			document.onselectstart = function () {
				return false;
			};
		},
		
		changeVideoSource: function (element) {
			var currentVersionEl = $(element).parent().parent().parent();
			currentVersion = currentVersionEl.attr('class').replace(this.setClass('alternative-versions') + ' ', '');
			var labelEl = currentVersionEl.find(this.getClass('current-version'));
			var alternative = $(element).parent().attr('class').replace('.' + this.options.prefix + 'alternative-', '');
			
			if (currentVersion != alternative) {
				var version = this.options.videos[alternative];
				
				labelEl.html(version.label);
				labelEl.parent().removeClass(currentVersion).addClass(alternative);

				video = this.video.get(0);
				video.pause();
			
				this.resetVideo();

				if (this.supportHTML5) {
					video.src = this.getVideoSource(version);
				}
				else {
					video.changeVideo(this.getVideoSource(version));
				}
				
				var ul = $(this.getClass('alternative-versions')).find('ul');
				ul.html('');
				
				for (alternative in this.options.videos) {
					var alternativeObj = this.options.videos[alternative];
					if (alternativeObj != version) {
						if (alternativeObj.source) {
							var li = $('<li class="'+this.getClass('alternative-' + alternative)+'"><a href="javascript:;"><span></span></a></li>');
							if (alternativeObj.label) {
								li.find('span').html(alternativeObj.label);
							}

							var _this = this;
							li.find('a').bind('click', function () { _this.changeVideoSource(this); });
							
							ul.append(li);
						}
					}
				}
			
				var _this = this;
			
				video.addEventListener('loadedmetadata', function () {
					this.play();
				
					if (_this.options.onVideoChange) {
						_this.options.onVideoChange.call();
					}
				
				}, true);
			}
		},

		checkSupport: function () {
			var videoEl = document.createElement('video');
			if (videoEl.canPlayType) {
				return this.start();
			}
			else {
				var hasFlash = false;
				try {
					var activeX = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
					if (activeX) {
						hasFlash = true;
					}
				} catch (e) {
					if (navigator.mimeTypes["application/x-shockwave-flash"] != undefined) {
						hasFlash = true;
					}
				}

				if (hasFlash) {
					this.startFallback();
				}
			}
		},
		
		createAlternative: function () {
			var element = $('<div class="'+ this.setClass('alternative-versions') +'"></div>');
			element.append('<span class="'+this.setClass('current-version')+'">'+this.defaultVideo.label+'</span>');
			element.append('<ul></ul>');
			
			for (alternative in this.options.videos) {
				var alternativeObj = this.options.videos[alternative];
				
				if (alternativeObj != this.defaultVideo) {
					if (alternativeObj.source) {
						var li = $('<li class="'+this.getClass('alternative-' + alternative)+'"><a href="javascript:;"><span></span></a></li>');
						if (alternativeObj.label) {
							li.find('span').html(alternativeObj.label);
						}

						var _this = this;
						li.find('a').bind('click', function () { _this.changeVideoSource(this); });
					
						element.find('ul').append(li);
					}
				}
				else {
					element.addClass(alternative);
				}
			}
			
			return element;
		},
		
		createButton: function (labelName, className) {
			var btn = $('<div>').addClass(this.setClass(className));
			var label = $('<span>').html(labelName);
			btn.append(label);
			
			return btn;
		},
		
		createClearFloats: function () {
			return '<div style="clear:both;width:0;height:0;margin:0;padding:0;"><!-- --></div>';
		},
		
		createControls: function () {
			this.controls = $('<div>').addClass(this.setClass(this.options.controlsClass));
			
			for (var i = 0; i < this.options.controls.length; i++) {
				switch (this.options.controls[i]) {
					case 'play':
						var playBtn = this.createButton('Play/Pause', 'play');
						this.controls.append(playBtn);
						break;
					case 'progress':
						var progressBar = this.createProgressBar();
						this.controls.append(progressBar);
						break;
					case 'time':
						var timeDisplay = this.createTimeDisplay();
						this.controls.append(timeDisplay);
						break;
					case 'volume':
						var volumeBar = this.createVolumeBar();
						this.controls.append(volumeBar);
						break;
					case 'fullscreen':
						if ($.browser.webkit || $.browser.mozilla) {
							var fullScreenBtn = this.createButton('Fullscreen', 'fullscreen');
							this.controls.append(fullScreenBtn);
						}
						break;
					case 'alternative':
						var alternative = this.createAlternative();
						this.controls.append(alternative);
						break;
					default:
						var customButton = this.createCustomButton(this.options.controls[i]);
						this.controls.append(customButton);
						break;
				}
			}
			
			// clear floats
			this.controls.append(this.createClearFloats());
			this.selector.append(this.controls);
		},
		
		createCustomButton: function (button) {
			var buttonElement = null;
			var buttonObj = this.options.customButtons[button];
			if (buttonObj) {
				if (buttonObj.url) {
					buttonElement = $('<div><a href="'+buttonObj.url+'"></a></div>');
					
					if (buttonObj.label)
						buttonElement.find('a').html(buttonObj.label);
						
					if (buttonObj.className) {
						buttonElement.addClass(buttonObj.className);
					}
						
					if (buttonObj.target) {
						buttonElement.find('a').attr('target', buttonObj.target);
					}
				}
				else if (buttonObj.onclick) {
					buttonElement = $('<div><a href="javascript:;"></a></div>');
					buttonElement.find('a').bind('click', buttonObj.onclick);
					
					if (buttonObj.className)
						buttonElement.addClass(buttonObj.className);
						
					if (buttonObj.label)
						buttonElement.find('a').html(buttonObj.label);
				}
				
				buttonElement.addClass(this.setClass('custom-button'));
				return buttonElement;
			}
			
			return false;
		},

		createFlashElement: function () {
			this.video = $('<object type="application/x-shockwave-flash" width="100%" height="100%"></object>').attr('data', this.options.fallbackOptions.movie);
			var params = {
				"allowScriptAccess": "always",
				"movie": this.options.fallbackOptions.movie,
				"allowNetworking": "all",
				"wmode": "opaque",
				"bgcolor": "#000000"
			};

			var flashvars = {
				"video": this.getVideoSource()
			};

			this.video.append(this.addParams(params, flashvars));

			$(this.selector).append(this.video);
		},

		addParams: function (params, flashvars) {
			var paramsArr = [],
				flashVarsArr = [],
				embed = '<embed ';
			
			for (var fv in flashvars) {
				flashVarsArr.push(fv + '=' +flashvars[fv]);
			}

			
			params.flashvars = flashVarsArr.join('&');
			
			for (var i in params) {
				paramsArr.push('<param name="' + i + '" value="' + params[i] + '">');
				embed += i + '="' + params[i] + '" ';
			}
				
			embed += '>';

			return paramsArr.join(' ') + embed;
		},
		
		createProgressBar: function () {
			var progressBar = $('<div>').addClass(this.setClass('progress-bar'));
			var progressWrapper = $('<div>').addClass(this.setClass('progress-wrapper'));
			var progressPlay = $('<div>').addClass(this.setClass('progress-play'));
			var progressPointer = $('<div>').addClass(this.setClass('progress-pointer'));
			var progressBuffer = $('<div>').addClass(this.setClass('progress-buffer'));
			
			progressWrapper.append(progressPlay);
			progressWrapper.append(progressPointer);
			progressWrapper.append(progressBuffer);
			progressWrapper.append(this.createClearFloats());
			progressBar.append(progressWrapper);
			
			return progressBar;
		},
		
		createTimeDisplay: function () {
			var time = $('<div>').addClass(this.setClass('time-display'));
			var current = $('<div>').addClass(this.setClass('time-current'));
			var separator = $('<div>').addClass(this.setClass('time-separator'));
			var total = $('<div>').addClass(this.setClass('time-total'));
			
			time.append(current);
			time.append(separator);
			time.append(total);
			
			return time;
		},
		
		createVideoElement: function () {
			this.video = $('<video>Your browser doesn\'t support video tag.</video>');
			this.video.attr('src', this.getVideoSource());
			this.video.width('100%');
			this.video.height('100%');
			
			if (this.defaultVideo.subtitle) {
				this.video.append('<track src="'+this.defaultVideo.subtitle+'"></track>');
			}
			
			$(this.selector).append(this.video);			
		},
		
		createVolumeBar: function () {
			var volume = $('<div>').addClass(this.setClass('volume'));
			var volumeBtn = $('<div>').addClass(this.setClass('volume-button')).html('Volume');
			var volumeBar = $('<div>').addClass(this.setClass('volume-bar'));
			var volumeIconPlus = $('<div>').addClass(this.setClass('volume-icon-plus')).html('+');
			var volumeWrapper = $('<div>').addClass(this.setClass('volume-wrapper'));
			var volumePosition = $('<div>').addClass(this.setClass('volume-position'));
			var volumeIconLess = $('<div>').addClass(this.setClass('volume-icon-less')).html('-');
			
			volumeWrapper.append(volumePosition);
			
			volumeBar.append(volumeIconPlus);
			volumeBar.append(volumeWrapper);
			volumeBar.append(volumeIconLess);
			
			volume.append(volumeBtn);
			volume.append(volumeBar);
			
			return volume;
		},

		eventsToBind: function () {
			if ($.inArray('progress', this.options.controls)) {
				this.setProgressEvents(this.video.get(0));
			}
		
			if ($.inArray('time', this.options.controls)) {		
				this.setupTime();
			}
			
			if ($.inArray('volume', this.options.controls)) {		
				this.volumeSetup();
			}
		},
		
		findPosX: function (obj) {
			obj = obj.get(0);
			var curleft = obj.offsetLeft;
			while(obj = obj.offsetParent) {
				curleft += obj.offsetLeft;
			}
			
			return curleft;
		},
		
		findPosY: function (obj) {
			obj = obj.get(0);
			var curtop = obj.offsetTop;
			while(obj = obj.offsetParent) {
				curtop += obj.offsetTop;
			}

			return curtop;
		},
		
		formatTime: function (secs) {
			var minutes = Math.floor(secs / 60);
			var seconds = Math.round(secs - (minutes * 60));
			
			if (seconds == 60) {
				seconds = 0;
				minutes = minutes + 1;
			}
			
			if (seconds < 10) {
				seconds = '0' + seconds;
			}
			
			return minutes + ':' + seconds;
		},
		
		fullscreenEvent: function () {
			this.setupProgressBar();
			
			var fullScreenBtn = $(this.getClass('fullscreen'));			
			fullScreenBtn.toggleClass('fullscreen');
			
			this.selector.toggleClass('fullscreen');
		},
		
		getClass: function (name) {
			return '.' + this.options.prefix + name;
		},
		
		getControlsSize: function () {
			var size = 0;
			var _this = this;
			
			this.selector.find(this.getClass('video-controls')).children().each(function () {
				var element = $(this);
				if (!element.hasClass(_this.setClass('progress-bar'))) {
					size += element.outerWidth();
				}
			});
			
			return size;
		},
		
		getDefaultVideo: function () {
			if (this.options.videos[this.options.defaultVideo]) {
				this.defaultVideo = this.options.videos[this.options.defaultVideo];
				return this.defaultVideo;
			}
			
			for (var video in this.options.videos) {
				this.defaultVideo = this.options.videos[video];
				return this.defaultVideo;
			}
		},
		
		getMaxTime: function () {
			if (typeof(this.subtitleObj.current) != 'undefined') {
				var timeArr = this.subtitleObj.current[1].split(' --> ');
				return this.timecodeToSec(timeArr[1]);
			}
		},
		
		getMinTime: function () {
			if (typeof(this.subtitleObj.current) != 'undefined') {
				var timeArr = this.subtitleObj.current[1].split(' --> ');
				return this.timecodeToSec(timeArr[0]);
			}
		},

		getSubtitle: function () {
			return this.defaultVideo.subtitle;
		},
		
		getVideoSource: function (videoObj) {
			if (!videoObj) {
				videoObj = this.defaultVideo;
			}
			
			if (this.supportHTML5 && (($.browser.safari && !/Chrome[\/\s](\d+\.\d+)/.test(navigator.userAgent)) || $.browser.msie)) {
				return videoObj.source.mp4;
			}
			else {
				return this.options.fallbackOptions.relativePath + videoObj.source.mp4;
			}
			
			if (videoObj.source.ogg) {
				return videoObj.source.ogg;
			}
			
			return videoObj.source.webm;
		},
		
		hideControls: function (controls) {
			controls.animate({bottom: '-' + controls.height() + 'px'});
		},
		
		incrementId: function () {
			var id = this.options.videoId + this.idCounter;
			this.idCounter++;
			
			return id;
		},
		
		muteVideo: function () {
			var volumeButton = this.selector.find(this.getClass('volume-button'));	
			var volumePosition = this.selector.find(this.getClass('volume-position'));
			var video = this.video.get(0);
			
			if (this.supportHTML5) {
				if (video.muted) {
					video.muted = false;
					volumeButton.removeClass('muted');
					volumePosition.height(video.volume * 100 + '%');
				}
				else {
					video.muted = true;
					volumeButton.addClass('muted');
					volumePosition.height(0);
				}
			}
			else {
				if (this.flashMuted) {
					this.flashMuted = false;
					video.volume(this.flashVolume);
					volumeButton.removeClass('muted');
					volumePosition.height(this.flashVolume * 100 + '%');
				}
				else {
					this.flashMuted = true;
					this.flashVolume = video.getVolume();
					video.volume(0);
					volumeButton.addClass('muted');
					volumePosition.height(0);
				}
			}
		},

		pauseEvent: function (element) {
			$(element).parent().find(this.getClass('play')).removeClass('playing').addClass('paused');	
			
			if (this.options.onPause) {
				this.options.onPause.call();
			}
				
			this.playing = false;
		},

		playEvent: function (element) {
			// _this.bufferInterval = setInterval(function () {
			// 	_this.updateBuffer(video, buffer);
			// }, 1000);
			
			$(element).parent().find(this.getClass('play')).removeClass('paused').addClass('playing');
			this.seekVideoSetup(element);
			
			if (this.options.onPlay) {
				this.options.onPlay.call();
			}
			
			this.playing = true;
		},
		
		playPause: function () {
			var videoObj = this.video.get(0);

			if (this.supportHTML5) {
				if (videoObj.paused) {
					videoObj.play();
				} else {
					videoObj.pause();
				}
			}
			else {
				if (videoObj.paused()) {
					videoObj.play();
				} else {
					videoObj.pause();
				}
			}
		},
		
		resetVideo: function () {
			this.controls.find(this.getClass('video-controls') + ', ' + this.getClass('progress-buffer')).css('width', 0);
			clearInterval(this.bufferInterval);
		},
		
		seekTo: function (xPos, progWrapper, video) {
			var progressBar = $(this.getClass('progress-play'));
			var progWidth = Math.max(0, Math.min(1, ( xPos - this.findPosX(progWrapper) ) / progWrapper.width() ));

			var seekTo = progWidth * (this.supportHTML5 ? video.duration : video.duration());
			
			if (this.supportHTML5) {
				video.currentTime = seekTo;
			}
			else {
				video.seekTo(seekTo);
			}
			
			var width = Math.round(progWidth * (progWrapper.width()));
			
			progressBar.width(width);
		},
		
		seekVideoSetup: function (video) {
			var progWrapper = $(video).parent().find(this.getClass('progress-wrapper'));
			if (progWrapper.length > 0) {
				this.selectable = true;
				
				var _this = this;
				
				progWrapper.get(0).addEventListener('mousedown', function (event) {
					event.preventDefault();
					_this.blockSelection();
					
					$(document).bind('mousemove', function (e) {
						e.preventDefault();
						_this.seekTo(e.pageX, progWrapper, video);
					});
					
					$(document).bind('mouseup', function (e) {
						e.preventDefault();
						_this.unblockSelection();
						$(document).unbind('mousemove');
						$(document).unbind('mouseup');
					});
				}, true);
				
				progWrapper.get(0).addEventListener('mouseup', function (e) {
					_this.seekTo(e.pageX, progWrapper, video);
				}, true);
			}
		},
		
		setClass: function (name) {
			return this.options.prefix + name;
		},
		
		setProgressEvents: function (video) {
			var _this = this;
			var scrubbing = $(this.getClass('progress-play'));
			var buffer = $(this.getClass('progress-buffer'));

			if (this.supportHTML5) {
				video.addEventListener('seeked', function () {
					if (!video.paused)
						video.play();
						
					if (_this.subtitleObj && _this.subtitleObj.loaded) {
						_this.adjustSubtitle(this);
					}
						
					if (_this.options.onSeek) {
						_this.options.onSeek.call();
					}
				}, true);
				
				video.addEventListener('ended', function () {
					scrubbing.width('100%');
					clearInterval(_this.progressInterval);
					
					this.currentTime = 0;
					this.pause();
					
					if (_this.options.onEnd) {
						_this.options.onEnd.call();
					}
					
					_this.playing = false;
					
				}, true);
				
				video.addEventListener('timeupdate', function () {
					_this.updateVideoData(this, scrubbing);
					_this.updateCurrentTime(this);
					
					if (_this.subtitleObj && _this.subtitleObj.loaded) {
						_this.updateSubtitle(video);
					}
					
				}, false);
				
				video.addEventListener('play', 
					function () {
						_this.playEvent(this);
					},
					true
				);
				
				video.addEventListener('pause', function () {
					_this.pauseEvent(this);
				}, true);
			}
			else {
				var flashObj = _this.video.get(0);
				this.flashInterval = setInterval(function () {
					_this.updateVideoData(flashObj, scrubbing);
					_this.updateCurrentTime(flashObj);
					
					if (_this.subtitleObj && _this.subtitleObj.loaded) {
						_this.updateSubtitle(flashObj);
					}
				}, 500);

				$(document).bind('flash.play', function () {
					_this.playEvent(flashObj);
				});

				$(document).bind('flash.pause', function () {
					_this.pauseEvent(flashObj);
				});

				$(document).bind('flash.seeked', function () {
					clearTimeout(_this.seekTimeout);
					_this.seekTimeout = setTimeout(function () {
						if (!flashObj.paused())
							flashObj.play();
							
						if (_this.subtitleObj && _this.subtitleObj.loaded) {
							_this.adjustSubtitle(flashObj);
						}
							
						if (_this.options.onSeek) {
							_this.options.onSeek.call();
						}
					}, 200);
				});

				$(document).bind('flash.videoChanged', function () {
					flashObj.play();

					if (_this.subtitleObj && _this.subtitleObj.loaded) {
						_this.adjustSubtitle(flashObj);
					}
				
					if (_this.options.onVideoChange) {
						_this.options.onVideoChange.call();
					}
				});
			}
		},
		
		setupProgressBar: function () {
			var progressBar = this.selector.find(this.getClass('progress-bar'));
			var controlsSize = progressBar.parent().width() - this.getControlsSize();
			
			progressBar.width(controlsSize);
		},
		
		setupSubtitles: function () {
			var _this = this;
			this.subtitleObj = {};
			
			var src = this.defaultVideo.subtitle;
			
			if (src) {
				$.ajax({
					url: src,
					success: function (data) {
						_this.subtitleObj.loaded = true;
						_this.subtitlesToArray(data);
						_this.subtitleObj.count = 0;
						_this.subtitleObj.current = _this.subtitleObj.content[_this.subtitleObj.count];
					}
				});
				
				var subtitleEl = $('<div id="subtitle-'+this.selector.attr('id')+'" class="'+this.setClass('subtitle')+'"></div>');
				var subtitleContent = $('<div class="'+this.setClass('subtitle-content')+'"></div>');
				
				subtitleEl.append(subtitleContent);
				
				this.subtitleObj.element = subtitleEl;
				
				this.selector.append(this.subtitleObj.element);
			}
		},
		
		setupTime: function () {
			var time = this.selector.find(this.getClass('time-display')),
				totalTime = time.find(this.getClass('time-total'));

			time.find(this.getClass('time-current')).html(this.formatTime(0));
			time.find(this.getClass('time-separator')).html(this.options.timeSeparator);
			if (this.supportHTML5) {
				totalTime.html(this.formatTime(this.video.get(0).duration));
			}
			else {
				var _this = this;
				this.getDurationInterval = setInterval(function () {
					if (_this.video.get(0).duration() > 0) {
						totalTime.html(_this.formatTime(_this.video.get(0).duration()));
						clearInterval(_this.getDurationInterval);
					}
				}, 10);
			}
		},
		
		subtitlesToArray: function (data) {
			this.subtitleObj.content = [];
			var breakLine = (data.search('\r\n') == -1) ? '\n' : '\r\n';
			var records = data.split(breakLine + breakLine);
			
			for (var i = 0; i < records.length; i++) {
				if (records[i].length > 0) {
					this.subtitleObj.content.push(records[i].split(breakLine));
				}
			};
		},
		
		timecodeToSec: function (tc) {
			if (tc) {
				tc1 = tc.split(',');
				tc2 = tc1[0].split(':');
				seconds = Math.floor(tc2[0] * 60 * 60) + Math.floor(tc2[1] * 60) + Math.floor(tc2[2]);
				
				return seconds;
			}
		},
		
		toFullscreen: function () {
			if (this.supportHTML5) {
				if (!this.fullscreen) {
					if (this.selector.get(0).webkitRequestFullScreen) {
						this.selector.get(0).webkitRequestFullScreen();
					}
					else if (this.selector.get(0).mozRequestFullScreen) {
						this.selector.get(0).mozRequestFullScreen();
						this.setupProgressBar();
					}
					
					$(this.getClass('fullscreen')).removeClass('hover');
					
					this.fullscreen = true;
				}
				else {
					if (document.webkitCancelFullScreen) {
						document.webkitCancelFullScreen();
					}
					else if (document.mozCancelFullScreen) {
						document.mozCancelFullScreen();
					}
					
					$(this.getClass('fullscreen')).removeClass('hover');
					
					this.fullscreen = false;
				}
			}
			else {

				// TODO
				var video = this.video.get(0);

				if (!this.fullscreen) {
					this.selector.addClass('fullscreen');
					this.setupProgressBar();
					$(this.getClass('fullscreen')).removeClass('hover');
					this.fullscreen = true;
				}
				else {
					this.selector.removeClass('fullscreen');
					this.setupProgressBar();
					$(this.getClass('fullscreen')).removeClass('hover');					
					this.fullscreen = false;
				}
			}
		},
		
		unblockSelection: function () {
			document.onselectstart = function () {
				return true;
			};
		},
		
		updateBuffer: function (video, buffer) {
			if (video.buffered && video.buffered.length > 0) {
				var width = (video.buffered.end(0) / video.duration * 100) + '%';
				buffer.width(width);
			}
			else {
				buffer.width('100%');
				clearInterval(this.bufferInterval);
			}
		},
		
		updateCurrentTime: function (video) {
			var currentTime = this.supportHTML5 ? video.currentTime : video.currentTime();
			var currentTimeElement = $(video).parent().find(this.getClass('time-current'));
			currentTimeElement.html(this.formatTime(currentTime));
		},
		
		updateSubtitle: function (video) {
			var currentTime = this.supportHTML5 ? video.currentTime : video.currentTime();
			
			if (currentTime > this.getMinTime() && currentTime < this.getMaxTime()) {
				this.subtitleObj.current = this.subtitleObj.content[this.subtitleObj.count];
				this.subtitleObj.subtitle = this.subtitleObj.current[2];
			} else {
				this.subtitleObj.subtitle = '';
			}
			
			if (currentTime > this.getMaxTime()) {
				this.subtitleObj.count++;
				this.subtitleObj.current = this.subtitleObj.content[this.subtitleObj.count];
			}
			
			this.subtitleObj.element.find('div:first').html(this.subtitleObj.subtitle);
		},
		
		updateVideoData: function (video, scrubbing) {
			var pointer = scrubbing.parent().find(this.getClass('progress-pointer'));
			var scrubbingWidth = (this.supportHTML5 ? video.currentTime : video.currentTime()) * 100 / (this.supportHTML5 ? video.duration : video.duration());
			scrubbing.width(scrubbingWidth + '%');
			pointer.css('left', scrubbingWidth + '%');
		},
		
		volumeSetup: function () {
			var video = this.video.get(0);
			var volWrapper = this.selector.find(this.getClass('volume-wrapper'));
			var _this = this;
			
			volWrapper.bind('mousedown', function (event) {
				event.preventDefault();
				
				_this.blockSelection();
				
				$(document).bind('mousemove', function (event) {
					event.preventDefault();
					_this.volumeTo(event.pageY, volWrapper, video);
				});
				
				
				$(document).bind('mouseup', function (event) {
					event.preventDefault();
					
					_this.unblockSelection();
					
					$(document).unbind('mousemove');
					$(document).unbind('mouseup');
				});
			});
			
			volWrapper.bind('mouseup', function (event) {
				_this.volumeTo(event.pageY, volWrapper, video);
			});
		},
		
		volumeTo: function (yPos, volWrapper, video) {
			var volumeBar = $(this.getClass('volume-position'));
			var volHeight = Math.max(0, Math.min(1, ( yPos - volWrapper.offset().top ) / volWrapper.height() ));
			
			var invertedPercent = (volHeight - 1) * -1;

			if (this.supportHTML5) {
				video.volume = invertedPercent;
			}
			else {
				video.volume(invertedPercent);
			}
			
			volumeBar.height(invertedPercent * 100 + '%');
			
			var volumeButton = $(this.getClass('volume-button'));
			
			if (invertedPercent <= 0) {
				volumeButton.addClass('muted');
			}
			else {
				volumeButton.removeClass('muted');
			}
		}
	};
	
	$.fn.jQPlayer = function (options) {
		var defaults = {
			controls: ['play', 'progress', 'time', 'volume', 'fullscreen', 'alternative'],
			controlsClass: 'video-controls',
			customButtons: {},
			defaultVideo: 'standard',
			floatControls: false,
			onEnd: false,
			onPause: false,
			onPlay: false,
			onSeek: false,
			onStart: false,
			onVideoChange: false,
			prefix: 'html-player-',
			timeSeparator: '/',
			videoId: 'video-',
			fallbackOptions: {
				defaultVideo: 'standard',
				videos: false
			}
		};
		
		var options = $.extend(defaults, options);
		return new VideoPlayer(this, options);
	};
})(jQuery);
