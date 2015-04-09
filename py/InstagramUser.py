#!/usr/bin/python

from json import loads, dumps

'''
	Object containing all information for a user
'''

class InstagramUser(object):
	def __init__(self, username):
		self.name = username
		self.id = None
		self.posts = []
		self.bio = None
		self.website = None
		self.profile_picture = None
		self.full_name = None

		# Metainfo
		self.total_media = 0
		self.current_media = 0
		self.hit_oldest_post = False
		self.hit_newest_post = False
		self.max_id = None
		self.min_id = None
		self.last_updated = 0
	
	def deserialize(self, json):
		if 'id'              in json: self.id = json['id']
		if 'posts'           in json: self.posts = json['posts']
		if 'bio'             in json: self.bio = json['bio']
		if 'website'         in json:self.website = json['website']
		if 'profile_picture' in json: self.profile_picture = json['profile_picture']
		if 'full_name'       in json: self.full_name = json['full_name']

		if 'total_media'     in json: self.total_media = json['total_media']
		if 'current_media'   in json: self.current_media = json['current_media']
		if 'hit_oldest_post' in json: self.hit_oldest_post = json['hit_oldest_post']
		if 'hit_newest_post' in json: self.hit_newest_post = json['hit_newest_post']
		if 'max_id'          in json: self.max_id = json['max_id']
		if 'min_id'          in json: self.min_id = json['min_id']
		if 'last_updated'    in json: self.last_updated = json['last_updated']

	def serialize(self):
		return dumps({
			'id' : self.id,
		  'posts' : self.posts,
			'bio' : self.bio,
			'website' : self.website,
			'profile_picture' : self.profile_picture,
			'full_name' : self.full_name,

			'total_media' : self.total_media,
			'current_media' : self.current_media,
		  'hit_oldest_post' : self.hit_oldest_post,
		  'hit_newest_post' : self.hit_newest_post,
		  'max_id' : self.max_id,
		  'min_id' : self.min_id,
			'last_updated' : self.last_updated,
		}, indent=2)

