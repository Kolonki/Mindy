/////////// TODO:
// по кнопке добавить прямоуг +
// попробовать написать в нем текст +
// связи

//отдельные функции для выделения через замыкания
//

var RECT_WIDTH = 160,
	RECT_HEIGHT = 40;

window.onload = function() {

	var selected_concept,

	down = function() {
		if (selected_concept !== undefined) {
			selected_concept.attr({"stroke":"black"});
		}
		selected_concept = this;
		this.attr({"stroke":"blue"});

		this.ox = this.attr("x");
		this.oy = this.attr("y");
		this.animate({"fill-opacity": .05}, 200);

		console.log('x = ' + this.ox + ' y = '+ this.oy);
		//$('#debug').text('x = ' + this.ox + ' y = '+ this.oy);
	},

	up = function() {
		this.animate({"fill-opacity": 0}, 100);
	},

	move = function(dx, dy) {
		var new_attr = {x: this.ox + dx, y: this.oy + dy};
		this.attr(new_attr);

		new_attr.x += RECT_WIDTH / 2;
		new_attr.y += RECT_HEIGHT / 2;
		this.concept_text.attr(new_attr);
	},

	addConcept = function(text) {
		var x0 = 295, y0 = 85;
		var rect = r.rect(x0, y0, RECT_WIDTH, RECT_HEIGHT, 10);

		rect.attr({ "fill": "#0000ff", "fill-opacity": 0, "cursor": "move" });

		var new_text = r.text(x0 + (RECT_WIDTH/2), y0 + (RECT_HEIGHT/2), "Hi...");

		new_text.attr({ "text-anchor":"middle", fill:'#000000', "font-size": 14 });
		rect.concept_text = new_text;
		rect.drag(move, down, up);

		shapes.push(rect);

		console.log(shapes);
		return rect;
	},

	removeAll = function() {

		for (var i = 0, ii = shapes.length; i < ii; i++) {
			shapes[i].concept_text.remove();
			shapes[i].remove();
		}
		shapes.splice(0, shapes.length);
	},

	remove = function() {

		selected_concept.concept_text.remove();
		selected_concept.remove();

		var index = shapes.indexOf(selected_concept);
		shapes.splice(index, 1);		
	}

	changeText = function(new_text) {

		selected_concept.concept_text.attr({"text": new_text});
	},

	r = Raphael("workarea", 640, 480);
	shapes = [ /*r.rect(290, 80, 160, 40, 10),
			   r.rect(400, 20, 160, 40, 10)*/
			 ],
	connections = []; 

	$('#add').click(addConcept);
	$('#clear').click(removeAll);
	$('#remove').click(remove);
	$('#change_concept').click(function() {
		changeText( $('#input_concept_name').val() );
	});

	for (var i = 0, ii = shapes.length; i < ii; i++) {
		shapes[i].attr({ "fill": "#0000ff", "fill-opacity": 0, "cursor": "move" });
		shapes[i].drag(move, down, up);
	}
};