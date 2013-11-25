//	TODO:
//
//	Передать page как параметр во view


window.onload = function() {

/*
 *
 * Observer pattern
 *
*/

function Event(sender) {

	this._sender = sender; 	//Event initiator
	this._listeners = [];	//Functions to be called with (sender, args) args.
							//args are passed from notify(args)
}

Event.prototype = {
	attach: function(listener) {

		this._listeners.push(listener);
	},

	notify: function(args) {
		
		var i;
		for (i = 0; i < this._listeners.length; i++) {
			this._listeners[i](this._sender, args);
		}
	}
};

/*
 *
 * Graph model
 *
*/

function GraphModel(nodes, edges) {

	this._nodes = nodes;

	this.selectedNodeId = -1; //Nothing is selected
	this.isSelectedForConnection = false; //if node is selected for connection

	this.selectedConnection = null; //Nothing is selected

	this.nodeAdded = new Event(this);
	this.nodeRemoved = new Event(this);
	this.nodeSelected = new Event(this);
	this.nodeRenamed = new Event(this);

	this.nodeSelectedForConnection = new Event(this);
	this.nodeDeselectedForConnection = new Event(this);
	this.connectionAdded = new Event(this);

	this.connectionWithYourselfError = new Event(this);
	this.connectionExistsError = new Event(this);

	this.connectionSelected = new Event(this);
	this.connectionDeselected = new Event(this);

	this.connectionRemoved = new Event(this);

	this.connectionWithNodeExistsError = new Event(this);

	this.connectionRenamed = new Event(this);

	this.mapSaved = new Event(this);
}

GraphModel.prototype = {

	generateNodeId: (function() {

		var NodeId = 0;			//Private field (closure magic)
		return function() {
			return ++NodeId;
		}
	})(),

	addNode: function(text, x, y) {

		var new_id = this.generateNodeId();
		var new_node = {		//связь хранится у меньшего id
			id: new_id,
			text: text,
			x: x,
			y: y,

			connections: {}
		};

		this._nodes[new_id] = new_node;
		this.nodeAdded.notify(new_node);

		return new_node;
	},

	deleteNode: function() {

		if ( this.connectionExists(this.selectedNodeId) ) {

			this.connectionWithNodeExistsError.notify();
		}
		else {

			var id = this.selectedNodeId;

			this.selectedNodeId = -1;

			delete this._nodes[id];
			this.nodeRemoved.notify(id);			
		}

	},

	getNodes: function() {
		return this._nodes;
	},

	getSelectedNodeId: function() {
		return this.selectedNodeId;
	},

	selectNode: function(id) {

		if (this.selectedConnection !== null) {
			this.deselectConnection(this.selectedConnection.id1, this.selectedConnection.id2);
		}

		var oldId = this.selectedNodeId;
		this.selectedNodeId = id;

		this.nodeSelected.notify( {"oldId": oldId, "id": id} );
	},

	changeCoords: function(id, x, y) {

		this._nodes[id].x = x;
		this._nodes[id].y = y;
	},

	renameNode: function(newText) {

		var id = this.selectedNodeId;
		this._nodes[id].text = newText;

		this.nodeRenamed.notify( {"id": id, "name": newText} );
	},


	selectForConnection: function() {

		this.isSelectedForConnection = true;
		this.nodeSelectedForConnection.notify(this.selectedNodeId);
	},

	deselectForConnection: function() {

		this.isSelectedForConnection = false;
		this.nodeDeselectedForConnection.notify(this.selectedNodeId);		
	},


	addConnection: function(id2, text) {
		
		this.deselectForConnection();

		id1 = this.selectedNodeId;

		if (id1 === id2) {
			this.connectionWithYourselfError.notify();
		}
		else {

			if (id2 < id1) {
				var temp = id2;
				id2 = id1;
				id1 = temp;
			}

			//now id1 < id2
			if (this._nodes[id1].connections[id2] !== undefined)
				this.connectionExistsError.notify();

			else {
				this._nodes[id1].connections[id2] = {
					"id1": id1,
					"id2": id2,
					"text": text
				};

				this.connectionAdded.notify({"id1": id1, "id2": id2, "text": text});					
			}

		
		}


	},

	selectConnection: function(id1, id2) {
		
		if (this.selectedConnection !== null) {
			this.deselectConnection(this.selectedConnection.id1, this.selectedConnection.id2);
		}

		if (this.selectNode !== -1) {
			this.selectNode(-1);			
		}

		this.selectedConnection = this._nodes[id1].connections[id2];
		this.connectionSelected.notify(this.selectedConnection);
	},

	deselectConnection: function(id1, id2) {

		var old_conn = this.selectedConnection;
		this.selectedConnection = null;

		this.connectionDeselected.notify(old_conn);
	},

	removeConnection: function() {


		var id1 = this.selectedConnection.id1,
			id2 = this.selectedConnection.id2;

		this.deselectConnection();

		this._nodes[id1].connections[id2] = undefined;

		this.connectionRemoved.notify({"id1": id1, "id2": id2});
	},

	connectionExists: function(nodeId) {


		for (var id in this._nodes[nodeId].connections) {

			if (this._nodes[nodeId].connections[id] !== undefined)
				return true;

		}

		for (var id in this._nodes) {

			if ( this._nodes[id].connections[nodeId] !== undefined )
				return true;
		}

		return false;
	},

	renameConnection: function(text) {

		this.selectedConnection.text = text;

		this.connectionRenamed.notify( {"conn": this.selectedConnection, "text": text} );
	},

	saveMap: function( success ) {

		var request = {
			id: url_id,
			map: JSON.stringify(this._nodes)
		};

		var _this = this;

		$.post('/ajax/map', request, function(data) {
			_this.mapSaved.notify();
			success();
		});
	},

	quit: function() {

		this.saveMap( function() {
			window.location.replace('/');			
		});
	},

	load: function() {

		var request = {
			id: url_id
		};

		var _this = this;
		$.getJSON('/ajax/map', request, function(loaded_map) {

			//console.log(loaded_map);

			var id_translate = {},
				conc;

			//рисуем все concept'ы
			for (var id in loaded_map) {
				conc = _this.addNode(loaded_map[id].text, loaded_map[id].x, loaded_map[id].y);
				id_translate[id] = conc.id;
			}

			//console.log(id_translate);

			//рисуем все связи
			for (var id in loaded_map) {
				for (var conn in loaded_map[id].connections) {

					if (loaded_map[id].connections[conn] !== undefined) {
						_this.selectNode(id_translate[loaded_map[id].connections[conn].id1]);
						_this.selectForConnection();
						_this.addConnection(id_translate[loaded_map[id].connections[conn].id2],
											loaded_map[id].connections[conn].text);
					}

				}
			}

			//console.log(_this._nodes);


		});
	}
};

/*
 *
 * Graph view
 *
*/

function GraphView(model, elements) {

	this._model = model;
	this._elements = elements;
	this._elements.rects = {};
	this._elements.connections = [];
	this.r = Raphael("workarea", 800, 600);

	var _this = this;

	//View Events
	this.addButtonClicked = new Event(this);
	this.removeButtonClicked = new Event(this);
	this.submitButtonClicked = new Event(this);
	this.addConnectionButtonClicked = new Event(this);
	this.cancelButtonClicked = new Event(this);
	this.removeConnectionButtonClicked = new Event(this);
	this.saveButtonClicked = new Event(this);
	this.quitButtonClicked = new Event(this);

	this.rectClicked = new Event(this);
	this.rectMoved = new Event(this);
	this.connClicked = new Event(this);


	this._elements.addButton.click(function() {

		_this.addButtonClicked.notify();
	});

	this._elements.removeButton.click(function() {

		_this.removeButtonClicked.notify();
	});
	
	this._elements.submitButton.click(function() {

		_this.submitButtonClicked.notify( _this._elements.inputField.val() );
	});

	this._elements.addConnectionButton.click(function() {


		_this.addConnectionButtonClicked.notify();

	});

	this._elements.cancelButton.click(function() {

		_this.cancelButtonClicked.notify();
	});

	this._elements.removeConnectionButton.click(function() {

		_this.removeConnectionButtonClicked.notify();
	});

	this._elements.saveButton.click(function() {

		_this.saveButtonClicked.notify();
	});	

	this._elements.quitButton.click(function() {

		_this.quitButtonClicked.notify();
	});	


	//Events from Model
	this._model.nodeAdded.attach(function(sender, rect) {

		_this.addRect(rect.id, rect.text, rect.x, rect.y);
	});

	this._model.nodeRemoved.attach(function(sender, id) {

		_this._elements.rects[id].concept_text.remove();
		_this._elements.rects[id].remove();

		delete _this._elements.rects[id];

		_this._elements.removeButton.attr("disabled", "disabled");
		_this._elements.submitButton.attr("disabled", "disabled");
		_this._elements.cancelButton.attr("disabled", "disabled");
		_this._elements.addConnectionButton.attr("disabled", "disabled");

	});

	this._model.nodeRenamed.attach(function(sender, args) {

		_this._elements.rects[args.id].concept_text.attr( {"text": args.name} );

	});
	
	this._model.nodeSelected.attach(function(sender, args) {

		//console.log("Old ID = " + ids.oldId);
		//console.log("New ID = " + ids.id);

		if (args.oldId !== -1)
			_this.deselectRect(args.oldId);

		if (args.id !== -1) {
			_this.selectRect(args.id);
			_this._elements.inputField.val(_this._elements.rects[args.id].concept_text.attrs.text);

			_this._elements.removeButton.removeAttr("disabled");
			_this._elements.submitButton.removeAttr("disabled");
			_this._elements.addConnectionButton.removeAttr("disabled");
			_this._elements.cancelButton.removeAttr("disabled");
		}
		else {
			_this._elements.cancelButton.attr("disabled", "disabled");
			_this._elements.removeButton.attr("disabled", "disabled");
			_this._elements.submitButton.attr("disabled", "disabled");
			_this._elements.addConnectionButton.attr("disabled", "disabled");
		}


	});

	this._model.nodeSelectedForConnection.attach(function(sender, nodeId) {

		_this.selectRectForConnection(nodeId);

		_this._elements.addConnectionButton.attr("disabled", "disabled");
		//_this._elements.cancelButton.attr("disabled", "disabled");
		_this._elements.removeButton.attr("disabled", "disabled");
		_this._elements.submitButton.attr("disabled", "disabled");
		_this._elements.addButton.attr("disabled", "disabled");


	});
	this._model.nodeDeselectedForConnection.attach(function(sender, nodeId) {

		_this.selectRect(nodeId); //just like before connection

		_this._elements.addConnectionButton.removeAttr("disabled");
		_this._elements.removeButton.removeAttr("disabled");
		_this._elements.submitButton.removeAttr("disabled");
		_this._elements.addButton.removeAttr("disabled");

	});

	this._model.connectionAdded.attach(function(sender, args) {

		_this.addConnection(args.id1, args.id2, args.text);
	});

	this._model.connectionWithYourselfError.attach(function(sender, args) {

		alert("Нельзя связать понятие с собой");
	});

	this._model.connectionExistsError.attach(function(sender, args) {

		alert("Связь уже существует");

	});


	this._model.connectionSelected.attach(function(sender, connection) {

		_this._elements.cancelButton.removeAttr("disabled");
		_this._elements.removeConnectionButton.removeAttr("disabled");
		_this._elements.submitButton.removeAttr("disabled");

		var conn;

		for (var i = 0; i < _this._elements.connections.length; i++) {
			conn = _this._elements.connections[i];

			if ((conn.from._id === connection.id1) && (conn.to._id === connection.id2)) {

				_this._elements.connections[i].line.attr({stroke: "#00f"});

				_this._elements.inputField.val(conn.conn_text.attrs.text);
			}			
		}
	});

	this._model.connectionDeselected.attach(function(sender, connection) {

		_this._elements.cancelButton.attr("disabled", "disabled");
		_this._elements.removeConnectionButton.attr("disabled", "disabled");
		_this._elements.submitButton.attr("disabled", "disabled");

		var conn;

		for (var i = 0; i < _this._elements.connections.length; i++) {
			conn = _this._elements.connections[i];

			if ((conn.from._id === connection.id1) && (conn.to._id === connection.id2)) {

				_this._elements.connections[i].line.attr({stroke: "#000"});
			}			
		}
	});

	this._model.connectionRemoved.attach(function(sender, connection) {

		for (var i = 0; i < _this._elements.connections.length; i++) {
			conn = _this._elements.connections[i];

			if ((conn.from._id === connection.id1) && (conn.to._id === connection.id2)) {

				conn.conn_text.remove();
				conn.line.remove();
				_this._elements.connections.splice(i, 1);
			}			
		}
	});

	this._model.connectionWithNodeExistsError.attach(function(sender, connection) {

		alert("Существуют связи с этим понятием");
	});

	this._model.connectionRenamed.attach(function(sender, args) {

		for (var i = 0; i < _this._elements.connections.length; i++) {
			conn = _this._elements.connections[i];

			if ((conn.from._id === args.conn.id1) && (conn.to._id === args.conn.id2)) {

				conn.conn_text.attr("text", args.text);
			}			
		}

	});

	this._model.mapSaved.attach(function(sender, connection) {

		alert("Карта сохранена");

	});

}

GraphView.prototype = {

	addRect: function(id, text, x0, y0) {

		var RECT_WIDTH = 160,
			RECT_HEIGHT = 40;

		var _this = this;

		function down() {

			this.ox = this.attr("x");
			this.oy = this.attr("y");
			this.animate({"fill-opacity": .05}, 200);

			_this.rectClicked.notify(this);	
		}

		function up() {

			this.animate({"fill-opacity": 0}, 100);

			_this.rectMoved.notify(this);
		}

		function move(dx, dy) {

			var new_attr = {x: this.ox + dx, y: this.oy + dy};
			this.attr(new_attr);

			new_attr.x += RECT_WIDTH / 2;
			new_attr.y += RECT_HEIGHT / 2;
			this.concept_text.attr(new_attr);

			function updateConnText(conn) {

				var x1 = conn.from.concept_text.attrs.x,
					x2 = conn.to.concept_text.attrs.x,
					y1 = conn.from.concept_text.attrs.y,
					y2 = conn.to.concept_text.attrs.y;

				conn.conn_text.attr({"x": (x1+x2)/2, "y": (y1+y2)/2});
			}

			for (var i = _this._elements.connections.length; i--;) {
                _this.r.connection(_this._elements.connections[i]);
                updateConnText(_this._elements.connections[i]);
            }
		}

		var rect = this.r.rect(x0, y0, RECT_WIDTH, RECT_HEIGHT, 10);
		rect.attr({ "fill": "#0000ff", "fill-opacity": 0, "cursor": "move" });

		var new_text = this.r.text(x0 + (RECT_WIDTH/2), y0 + (RECT_HEIGHT/2), text);
		new_text.attr({ "text-anchor":"middle", fill:'#000000', "font-size": 14 });

		rect.concept_text = new_text;

		rect.drag(move, down, up);

		rect._id = id;
		this._elements.rects[id] = rect;
	},

	selectRect: function(id) {

		this._elements.rects[id].attr({"stroke":"blue"});
	},

	selectRectForConnection: function(id) {

		this._elements.rects[id].attr({"stroke":"green"});
	},	

	deselectRect: function(id) {

		this._elements.rects[id].attr({"stroke":"black"});
	},

	addConnection: function(id1, id2, text) {

		//Here id1 < id2
		var conn = this.r.connection(this._elements.rects[id1], this._elements.rects[id2], "#000");

		var _this = this;

		function notifyOnClick() {
			_this.connClicked.notify(conn);			
		}
		
		conn.line.click(notifyOnClick);

		
		//text
		var x1 = conn.from.concept_text.attrs.x,
			x2 = conn.to.concept_text.attrs.x,
			y1 = conn.from.concept_text.attrs.y,
			y2 = conn.to.concept_text.attrs.y;

		var text = this.r.text((x1+x2)/2, (y1+y2)/2, text);

		text.attr({ "text-anchor":"middle", fill:'#000000', "font-size": 14 });

		text.click(notifyOnClick);
		conn.conn_text = text;

		this._elements.connections.push(conn);
	}
};

/*
 *
 * Graph controller
 *
*/

function GraphController(model, view) {

	this._model = model;
	this._view = view;

	var _this = this;

	this._view.addButtonClicked.attach(function(sender, args) {

		_this._model.addNode("Новое понятие", 100, 100);
	});

	this._view.removeButtonClicked.attach(function(sender, args) {

		_this._model.deleteNode();
	});

	this._view.submitButtonClicked.attach(function(sender, fieldValue) {

		if (_this._model.selectedConnection !== null) {

			_this._model.renameConnection(fieldValue);
		}
		else {
			_this._model.renameNode(fieldValue);			
		}

	});

	this._view.rectClicked.attach(function(sender, raphaelRect) {

		if (_this._model.isSelectedForConnection) {

			_this._model.addConnection(raphaelRect._id, "Новая связь");

		}
		else {

			var currentId = _this._model.getSelectedNodeId(),
				clickedId = raphaelRect._id;

			if (currentId !== clickedId) {
				_this._model.selectNode(clickedId);			
			}			
		}
	});

	this._view.rectMoved.attach(function(sender, raphaelRect) {

		_this._model.changeCoords(raphaelRect._id, raphaelRect.attrs.x, raphaelRect.attrs.y);
	});


	this._view.addConnectionButtonClicked.attach(function(sender, fieldValue) {

		_this._model.selectForConnection();
	});

	this._view.cancelButtonClicked.attach(function(sender, args) {

		if (_this._model.isSelectedForConnection) {
			_this._model.deselectForConnection();			
		}
		else {
			_this._model.selectNode(-1);			
		}

	});

	this._view.removeConnectionButtonClicked.attach(function(sender, args) {

		_this._model.removeConnection();
	});


	this._view.connClicked.attach(function(sender, conn) {
	
		if (!_this._model.isSelectedForConnection)
			_this._model.selectConnection(conn.from._id, conn.to._id);
	});

	this._view.saveButtonClicked.attach(function(sender, conn) {

		_this._model.saveMap( function(){} );
	});

	this._view.quitButtonClicked.attach(function(sender, conn) {

		_this._model.quit();
	});
}


var model = new GraphModel({}, {});
var view = new GraphView(model, {
	addButton: $("#add"),
	removeButton: $("#remove"),
	inputField: $("#input_concept_name"),
	submitButton: $("#change_concept"),
	addConnectionButton: $("#add_conn"),
	removeConnectionButton: $("#remove_conn"),
	cancelButton: $("#cancel_conn"),
	saveButton: $("#save_map"),
	quitButton: $("#quit")
});
var controller = new GraphController(model, view);



/////////////////

function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}

var url_id = getURLParameter('id');

model.load();


};

