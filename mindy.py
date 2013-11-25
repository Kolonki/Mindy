# -*- coding: utf-8 -*-

import bottle
import pymongo
import sys
import json

from bottle import static_file 

from bson.objectid import ObjectId

connection = pymongo.Connection("mongodb://localhost", safe=True)
db = connection.Mindy

# Static Routes
@bottle.get('/<filename:re:.*\.js>')
def javascripts(filename):
    return static_file(filename, '.')

@bottle.get('/<filename:re:.*\.css>')
def stylesheets(filename):
    return static_file(filename, '.')

@bottle.get('/<filename:re:.*\.(jpg|png|gif|ico)>')
def images(filename):
    return static_file(filename, '.')

@bottle.get('/<filename:re:.*\.(eot|ttf|woff|svg)>')
def fonts(filename):
    return static_file(filename, '.')

@bottle.route('/')
def home_page():
	
	# Получаем все карты из базы
	maps = db.Maps.find()
	return bottle.template('map_list', { "maps" : maps })

@bottle.get('/maps')
def editor_page():
	return bottle.template('index')

@bottle.post('/newmap')
def create_map():
	name = bottle.request.params.get("name")
	db.Maps.save({ 'name' : name })
	bottle.redirect('/')

@bottle.get('/deletemap')
def delete_map():
	id = bottle.request.params.get("id")
	db.Maps.remove({ '_id' : ObjectId(id) })
	bottle.redirect('/')	

@bottle.post('/ajax/map')
def save_map():
	map = bottle.request.params.get("map")
	id = bottle.request.params.get("id")

	# print json.loads(map)

	db.Maps.update({ '_id' : ObjectId(id)}, {'$set' : {'map': json.loads(map)}})

	# print map
	return map

@bottle.get('/ajax/map')
def get_map():

	id = bottle.request.params.get("id")
	python_dict_object = db.Maps.find_one({'_id': ObjectId(id) })
	python_dict_map = python_dict_object['map']
	return json.dumps(python_dict_map)


bottle.debug()
bottle.run(host="localhost",port=8080)