#!/usr/bin/python

from py.InstagramController import InstagramController

from traceback import format_exc # Stack traces
from cgi       import FieldStorage # Query keys
from json      import dumps

def get_keys():
	""" Retrieves key/value pairs from query, puts in dict """
	form = FieldStorage()
	keys = {}
	for key in form.keys():
		keys[key] = form[key].value
	return keys


def main():
	keys = get_keys()
	if 'method' not in keys:
		raise Exception("Required 'method' not found")

	# Recent
	if keys['method'] == 'recent':
		return dumps(InstagramController.get_recent())

	if 'user' not in keys:
		raise Exception("Required 'user' not found")

	controller = InstagramController(keys['user'].lower())

	# Requeting a user for the first time
	if keys['method'] == 'init':
		return controller.user.serialize()

	# Asking to fetch more photos for a user
	elif keys['method'] == 'more':
		return dumps(controller.get_posts())


if __name__ == '__main__':
	print "Content-Type: application/json"
	print ""
	try:
		print main()
	except Exception, e:
		print dumps({
			'error': str(e),
			'stack': str(format_exc())
		})
	print "\n\n"
