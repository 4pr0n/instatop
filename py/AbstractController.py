#!/usr/bin/python

import os, time
from json import dumps, loads

class AbstractController(object):
	def __init__(self):
		raise Exception("Requires username")

	def get_save_dir(self):
		if not os.path.exists('./users/'):
			os.makedirs('./users/')
		return './users/'
		
	def get_save_file(self):
		return '%s%s_%s' % (self.get_save_dir(), self.site_name, self.user.name)

	def update_recent(self, username, profile_picture, post_count):
		recent_file = '%srecent.json' % self.get_save_dir()
		if os.path.exists(recent_file):
			f = open(recent_file, 'r')
			recents = loads(f.read())
			f.close()
		else:
			recents = []

		already_in_list = False
		for entry in recents:
			if entry['name'] == self.user.name:
				# Entry's already in recent, push it to the bottom.
				temp = entry
				recents.remove(entry)
				recents.append(temp)
				already_in_list = True
				break

		if already_in_list or len(recents) == 20 and len(recents) > 0:
			recents.pop()

		# Add entry to beginning of list
		recents.insert(0, {
			'name' : username,
			'image' : profile_picture,
			'count' : post_count,
			'site' : self.site_name
		})

		f = open(recent_file, 'w')
		f.write(dumps(recents, indent=2))
		f.close()
		
	@staticmethod
	def get_recent():
		recent_file = './users/recent.json'
		if os.path.exists(recent_file):
			f = open(recent_file, 'r')
			recents = loads(f.read())
			f.close()
		else:
			recents = []
		return recents

