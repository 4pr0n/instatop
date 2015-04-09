#!/usr/bin/python

from Httpy import Httpy
from json import dumps, loads

class InstagramWrapper:
	httpy = Httpy()
	CLIENT_ID = 'ada2177105f94b05b21c3839c21d3794'

	@staticmethod
	def get_user_id(username):
		url = 'https://api.instagram.com/v1/users/search?q=%s' % username
		url += '&client_id=%s' % InstagramWrapper.CLIENT_ID
		json = loads(InstagramWrapper.httpy.get(url))
		users = json['data']
		for user in users:
			if user['username'] == username:
				return user['id']
		raise Exception("Username not found")

	@staticmethod
	def get_posts(user_id, max_id=None, min_id=None):
		url = 'https://api.instagram.com/v1/users/%s/media/recent/' % user_id
		url += '?client_id=%s' % InstagramWrapper.CLIENT_ID
		if max_id:
			url += '&max_id=%s' % max_id
		if min_id:
			url += '&min_id=%s' % min_id
		json = loads(InstagramWrapper.httpy.get(url))
		results = []
		for post in json['data']:
			result = {
				'id' : post['id'],
				'likes' : post['likes']['count'],
				'images' : post['images'],
				'link' : post['link'],
				'tags' : post['tags'],
				'type' : post['type'],
				'created' : post['created_time'],
			}
			if 'caption' in post and post['caption'] != None and 'text' in post['caption']:
				result['caption'] = post['caption']['text']
			if post['type'] == 'video' and 'videos' in post:
				result['videos'] = post['videos']
			results.append(result)
		return results

	@staticmethod
	def get_user_info(user_id):
		url = 'https://api.instagram.com/v1/users/%s' % user_id
		url += '?client_id=%s' % InstagramWrapper.CLIENT_ID
		json = loads(InstagramWrapper.httpy.get(url))
		data = json['data']
		return {
			'bio' : data['bio'],
			'website' : data['website'],
			'profile_picture' : data['profile_picture'],
			'full_name' : data['full_name'],
			'total_media' : data['counts']['media']
		}



if __name__ == '__main__':
	user_id = InstagramWrapper.get_user_id('russianbaby_mfc', min_id='0')
	posts = InstagramWrapper.get_posts(user_id)
	print len(posts)
	posts = InstagramWrapper.get_posts(user_id, max_id=posts[-1]['id'])
	print len(posts)
	posts = InstagramWrapper.get_posts(user_id, max_id=posts[-1]['id'])
	print len(posts)

