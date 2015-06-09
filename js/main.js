var ViewModel = function() {
	var self = this;
	this.inputUsername = ko.observable();
	this.username = ko.observable(this.inputUsername());

	this.isLoading = ko.observable(false);
	this.hasUserInfo = ko.observable(false);

	this.sortBy = ko.observable('likes');
	this.sortBy.subscribe(function(value) {
		self.sortPosts();
	});
	this.sortPosts = function() {
		self.isLoading(true);
		if (self.sortBy() === 'date') {
			// Sort by date
			self.posts.sort(function(a,b) {
				return parseInt(b.created) - parseInt(a.created);
			});
		}
		else {
			// Sort by likes
			self.posts.sort(function(a,b) {
				return b.likes - a.likes;
			});
		}
		// Update indices
		for (var i = 0; i < self.posts().length; i++) {
			self.posts()[i].index = i;
		}
		self.visiblePosts(self.posts().slice(0, self.visiblePostsSize()));
		self.isLoading(false);
	};

	this.sortByLikes = function() {
		self.sortBy('likes');
	};
	this.sortByDate = function() {
		self.sortBy('date');
	};

	this.reset = function() {
		this.isLoading(false);
		this.hasUserInfo(false);
		this.username("");
		this.bio("");
		this.website("");
		this.lastUpdated("");
		this.visiblePosts([]);
		this.visiblePostsSize(20);
		this.posts([]);
		this.totalMedia(0);
		this.currentMedia(0);
	};

	this.profilePicture = ko.observable();
	this.bio = ko.observable();
	this.website = ko.observable();
	this.lastUpdated = ko.observable();
	this.visiblePosts = ko.observableArray();
	this.visiblePostsSize = ko.observable(20);
	this.posts = ko.observableArray();
	this.totalMedia = ko.observable();
	this.currentMedia = ko.observable();

	this.recents = ko.observableArray([]);
	this.getRecents = function() {
		$.getJSON('./api.cgi?method=recent')
			.done(function(data) {
				if (data.error && data.stack) {
					toastr.error("Error: " + data.error);
					console.log(data.error, data.stack);
					return;
				}

				for (var i = 0; i < data.length; i++) {
					data[i].href = "#" + data[i].name;
				}
				self.recents(data);
			})
			.fail(function(x,y,z) {
				toastr.error("Failed to get list of recent users");
			});
	};

	this.submit = function() {
		window.location.hash = self.inputUsername();
	};

	this.getUser = function() {
		this.reset();
		self.username(self.inputUsername());
		if (self.username() === null) {
			self.getRecents();
			return;
		}
		self.hasUserInfo(false);
		self.isLoading(true);
		$.getJSON('./api.cgi?user=' + self.username() + '&method=init')
			.done(function(data) {
				if (data.error && data.stack) {
					toastr.error("Error: " + data.error);
					console.log(data.error, data.stack);
					self.isLoading(false);
					return;
				}
				self.profilePicture(data.profile_picture);
				self.bio(data.bio);
				self.website(data.website);
				self.lastUpdated(data.last_updated);
				var tempArray = [];
				for (var i = 0; i < data.posts.length; i++) {
					var p = new Post(data.posts[i]);
					tempArray.push(p);
				}
				self.posts(tempArray);
				self.sortPosts();
				self.totalMedia(data.total_media);
				self.currentMedia(data.current_media);
				self.hasUserInfo(true);

				if (data.posts.length == 0) {
					self.loadMore();
				}
				else {
					self.isLoading(false);
				}
			})
			.fail(function(x,y,z) {
				toastr.error("Failed to get posts for " + self.username() + ", status code: " + x.statusCode() + ", error: " + y);
				console.log("ERROR", x, y, z);
				self.isLoading(false);
			});
	};

	this.loadMore = function() {
		if (self.visiblePosts().length === self.totalMedia()) {
			// Nothing else to load, do nothing.
			toastr.info("Already loaded all photos for @" + self.username());
			return;
		}

		if (self.visiblePostsSize() < self.posts().length) {
			// We have more photos than we're showing
			self.visiblePostsSize(self.visiblePostsSize() + 20);
			self.visiblePosts(self.posts().slice(0, self.visiblePostsSize()));
			return;
		}

		// We need to fetch more photos
		self.isLoading(true);
		$.getJSON('./api.cgi?user=' + self.username() + '&method=more')
			.done(function(data) {
				if (data.error && data.stack) {
					toastr.error("Error: " + data.error);
					toastr.error("Trace: " + data.stack);
					console.log(data.error, data.stack);
					return;
				}
				toastr.info("Loaded " + data.length + " posts from @" + self.username());
				var tempArray = [];
				for (var i = 0; i < data.length; i++) {
					var p = new Post(data[i]);
					tempArray.push(p);
				}
				self.posts().push.apply(self.posts(), tempArray);
				self.visiblePostsSize(self.visiblePostsSize() + 20);
				self.visiblePosts(self.posts().slice(0, self.visiblePostsSize()));
				self.sortPosts();
			})
			.fail(function(x,y,z) {
				toastr.error("Failed to get posts for " + self.username() + ", status code: " + x.statusCode() + ", error: " + y);
				console.log("ERROR", x, y, z);
			})
			.always(function() {
				self.isLoading(false);
			});
	};

	this.toHRDate = function(date) {
		var d = new Date(date * 1000);
		var result =  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
		result += ' ' + d.getDate();
		if (d.getFullYear() != (new Date()).getFullYear()) {
			result += ' \'' + (d.getFullYear() % 100);
		}
		return result;
	};


	var Post = function(json) {
		var postSelf = this;
		this.thumbnail = json.images.thumbnail.url;
		if (json.type === 'video') {
			this.type = 'video';
			this.image = json.images.standard_resolution.url;
			this.video = json.videos.standard_resolution.url;
			this.width = json.videos.standard_resolution.width;
			this.height = json.videos.standard_resolution.height;
		}
		else {
			this.type = 'image';
			this.image = json.images.standard_resolution.url;
			this.width = json.images.standard_resolution.width;
			this.height = json.images.standard_resolution.height;
		}
		this.created = json.created;
		this.createdHR = self.toHRDate(this.created);
		this.likes = json.likes;
		this.showImage = function() {
			if (postSelf.type === 'image') {
				// Show image
				var $img = $('#imageModalContent img');
				if ($img.size() === 0) {
					$('#imageModalContent')
						.empty()
						.unbind('click')
						.bind('click', function() {
							$('#imageModal').modal('hide');
						});
					$img = $('<img />')
						.attr('src', postSelf.image)
						.css({
							'width' : postSelf.width + 'px',
							'height': postSelf.height + 'px'
						})
						.appendTo( $('#imageModalContent') );
				}
				else {
					// Clear existing image
					$img.attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==');
					// Load new image
					$img
						.attr('src', postSelf.image)
						.css({
							'width' : postSelf.width + 'px',
							'height': postSelf.height + 'px'
						})
				}
			}
			else if (postSelf.type === 'video') {
				// Show video
				$('#imageModalContent')
					.empty()
					.unbind('click');
				var $controls = $('<video controls id="imageModalVideo" />')
					.appendTo( $('#imageModalContent') );
				$('<source type="video/mp4"/>')
					.attr('src', postSelf.video)
					.attr('autoload', 'true')
					.appendTo( $controls );
			}
			// Prev image
			if (postSelf.index === 0) {
				$('#prevImage').css('visibility', 'hidden');
			}
			else {
				$('#prevImage')
					.css('visibility', 'visible')
					.unbind('click')
					.click(function() {
						self.posts()[postSelf.index - 1].showImage();
					});
			}
			// Next image
			if (postSelf.index === self.posts().length - 1) {
				$('#nextImage').css('visibility', 'hidden');
			}
			else {
				$('#nextImage')
					.css('visibility', 'visible')
					.unbind('click')
					.click(function() {
						self.posts()[postSelf.index + 1].showImage();
					});
			}
			if (!$('#imageModal').is(':visible')) {
				$('#imageModal').modal('show');
			}
		};
	}

	this.loadFromHash = function() {
		var hash = window.location.hash;
		if (hash === '') {
			// Load defaults
			self.inputUsername(null);
			self.getUser();
			return;
		}
		var user = hash.substring(1);
		self.inputUsername(user);
		self.getUser();
	};
};

var vm = null;
$(document).ready(function() {
	vm = new ViewModel();
	ko.applyBindings(vm, $('body')[0]);
	vm.getRecents();
	vm.loadFromHash();
	$(window).on('hashchange', function() {
		vm.loadFromHash();
	});

	$('#imageModal').on('hidden.bs.modal', function () {
		$('#imageModalContent').empty();
	});
	$('body').keydown(function(e) {
		if (e.keyCode === 37) { 
			// Left
			if ($('#imageModal').is(':visible')) {
				$('#prevImage').click();
			}
		} else if (e.keyCode === 39) {
			// Right
			if ($('#imageModal').is(':visible')) {
				$('#nextImage').click();
			}
		}
	});
});

