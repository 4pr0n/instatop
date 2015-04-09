#!/usr/bin/python

from AbstractController import AbstractController
from InstagramUser import InstagramUser
from InstagramWrapper import InstagramWrapper
import os, time
from json import dumps, loads

class InstagramController(AbstractController):

	def __init__(self, username):
		self.user = InstagramUser(username)
		self.site_name = "instagram"
		self.load()

	def load(self):
		fil = self.get_save_file()
		if os.path.exists(fil):
			f = open(fil, 'r')
			self.user.deserialize(loads(f.read()))
			f.close()

		if self.user.id == None:
			# We don't know the user ID yet.
			self.user.id = InstagramWrapper.get_user_id(self.user.name)
			self.update_info()
			self.hit_newest_post = False
		elif int(time.time()) - self.user.last_updated > 3600:
			# We haven't updated this user recently
			self.update_info()
			self.hit_newest_post = False
		else:
			self.hit_newest_post = True


		self.update_recent()
		self.save()

	def update_info(self):
		info = InstagramWrapper.get_user_info(self.user.id)
		self.user.deserialize(info)
		self.user.last_updated = int(time.time())

	def update_recent(self):
		super(InstagramController, self).update_recent(self.user.name, self.user.profile_picture, len(self.user.posts))
		
	def save(self):
		self.user.current_media = len(self.user.posts)
		self.user.posts.sort(key=lambda x: x['likes'], reverse=True)
		f = open(self.get_save_file(), 'w')
		f.write(self.user.serialize())
		f.close()

	def get_posts(self):
		if not self.user.hit_newest_post:
			# Get newest posts first
			posts = self.get_newer_posts()
		else:
			# We have newest post, get older posts now
			posts = self.get_older_posts()
		self.user.posts.extend(posts)
		self.user.posts.sort(key=lambda x: int(x['created']), reverse=True)
		self.user.max_id = posts[0]['id']
		self.user.min_id = posts[-1]['id']
		print '[asdf] min_id = %s' % self.user.min_id
		print '[asdf] max_id = %s' % self.user.max_id
		self.save()
		return posts


	def has_older_posts(self):
		return self.user.hit_oldest_post


	def get_older_posts(self):
		print "[asdf] getting older posts"
		posts = InstagramWrapper.get_posts(self.user.id, max_id=self.user.min_id)
		if len(posts) < 20:
			print "[asdf] HIT OLDEST POST"
			self.user.hit_oldest_post = True
		return posts


	def get_newer_posts(self):
		print "[asdf] getting newer posts"
		posts = InstagramWrapper.get_posts(self.user.id, min_id=self.user.max_id)
		if len(posts) < 20:
			print "[asdf] HIT NEWEST POST"
			self.user.hit_newest_post = True
		return posts


if __name__ == '__main__':
	c = InstagramController('russianbaby_mfc')
	c.get_posts()
	c.save()
