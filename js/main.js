var ViewModel = function() {
	var self = this;
	this.inputUsername = ko.observable("russianbaby_mfc");
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
				console.log('date', b,a, b.created, a.created);
				return parseInt(b.created) - parseInt(a.created);
			});
		}
		else {
			// Sort by likes
			self.posts.sort(function(a,b) {
				return b.likes - a.likes;
			});
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
					toastr.error("Trace: " + data.stack);
					console.log(data.error, data.stack);
					return;
				}

				for (var i = 0; i < data.length; i++) {
					data[i].href = "#" + data[i].name;
				}
				self.recents(data);
				toastr.info("Loaded " + data.length + " recent users");
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
		self.hasUserInfo(false);
		self.isLoading(true);
		$.getJSON('./api.cgi?user=' + self.username() + '&method=init')
			.done(function(data) {
				if (data.error && data.stack) {
					toastr.error("Error: " + data.error);
					toastr.error("Trace: " + data.stack);
					console.log(data.error, data.stack);
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
				self.visiblePosts(self.posts().slice(0, self.visiblePostsSize()));
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
				toastr.error("Failed to get user: " + z);
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
				toastr.error("Failed to get user: " + z);
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

	this.showImage = function(url) {
		$('#imageModalImage').attr('src', url);
		$('#imageModal').modal('show');
	};

	var Post = function(json) {
		var postSelf = this;
		this.thumbnail = json.images.thumbnail.url;
		if (json.type === 'video') {
			this.image = json.videos.standard_resolution.url;
		}
		else {
			this.image = json.images.standard_resolution.url;
		}
		this.created = json.created;
		this.createdHR = self.toHRDate(this.created);
		this.likes = json.likes;
		this.showImage = function() {
			$('#imageModalImage').attr('src', postSelf.image);
			$('#imageModal').modal('show');
		};
	}

	this.loadFromHash = function() {
		var hash = window.location.hash;
		if (hash === '') {
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
});

