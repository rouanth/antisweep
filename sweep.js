var csweep;

function td_id(name, i, j) {
	return [name, 'row', i, 'col', j].join('_');
}

function remove_children(node) {
	while (node.firstChild) {
		node.removeChild(node.firstChild);
	}
}

function sweep_to_table(swp, table, cellFunc, probs) {
	remove_children(table);
	for (var i = 0; i < swp.field.height; ++i) {
		var newTr = document.createElement('tr');
		for (var j = 0; j < swp.field.width; ++j) {
			newTr.appendChild(cellFunc(swp, i, j, probs));
		}
		table.appendChild(newTr);
	}
	return table;
}

function update_field(probs) {
	sweep_to_table(csweep, document.getElementById('sweep_field'),
			create_cell, probs);
}

function update_popup (e) {
	var popup = document.getElementById('popup');
	if (!popup) {
		return
	}
	popup.style.left = (e.clientX) + 'px';
	popup.style.top  = (e.clientY) + 'px';
}

function create_cell(swp, i, j, probs) {
	var callbacks = {};
	if (probs) {
		callbacks.mouseover = function (e) {
			var prob = probs[i][j];
			if (prob === -1) {
				return;
			}
			var popup = document.createElement('div');
			popup.id  = 'popup';
			var text = (prob * 100).toPrecision(3) + '%';
			var textNode = document.createTextNode(text);
			popup.appendChild(textNode);
			document.getElementsByTagName('body'
					)[0].appendChild(popup);
			update_popup (e);
		}
		callbacks.mouseout = function (e) {
			var popup = document.getElementById('popup');
			if (popup) {
				popup.remove();
			}
		}
	}
	var newCell = cell_to_dom(swp.field[i][j], callbacks);
	newCell.id = td_id('sweep_field', i, j);
	if (probs) {
		var color = get_color(probs[i][j]);
		newCell.style.backgroundColor = color;
	}
	pos = new Position2D (i, j);
	newCell.addEventListener("click", get_dialog(pos));
	return newCell;
}

function cell_to_dom (cell, callbacks) {
	var type = cell.type;
	var res = document.createElement ('td');
	res.className += ['cell', type].join('_');
	var text;
	if (cell.isBomb()) {
		text = '⚑';
	} else if (cell.isUnknown() || cell.isEmpty()) {
		text = '';
	} else {
		text = type;
	}
	var textNode = document.createTextNode(text);
	var boldText = document.createElement("b");
	boldText.appendChild(textNode);
	res.appendChild(boldText);

	for (var name in callbacks) {
		if (callbacks.hasOwnProperty(name)) {
			res.addEventListener(name, callbacks[name]);
		}
	}

	return res;
}

function close_dialog() {
	var old_dialog = document.getElementById('dialog');
	if (old_dialog) {
		old_dialog.remove();
	}
}

function get_dialog(pos) {
	return function (e) {
		close_dialog();
		var dialog = document.createElement('table');
		dialog.className = 'dialog';
		dialog.id = 'dialog';
		dialog.style['position'] = 'absolute';
		dialog.style['left'] = e.clientX + 'px';
		dialog.style['top']  = e.clientY + 'px';
		var types = [ '1', '2', '3', '4', '5', '6', '7', '8',
		'q', 'b', '0' ];
		function get_click_callback(type) {
			return function () {
				csweep.field[pos.row][pos.col].type = type;
				close_dialog();
				update_field();
			}
		}
		var width = 4;
		for (var i = 0; i < Math.ceil(types.length / width); ++i) {
			var row = document.createElement ('tr');
			for (var j = 0; j < width; ++j) {
				var type = types[i * width + j];
				if (!type) {
					break;
				}
				var callbacks = {
					click : get_click_callback(type)
				};
				var cell = cell_to_dom(new Cell(type),
						callbacks);
				row.appendChild(cell);
			}
			dialog.appendChild(row);
		}
		var body = document.getElementsByTagName('body')[0];
		body.appendChild(dialog);
	}
}

function apply_form() {
	var width = document.getElementById('field_width').value;
	var height = document.getElementById('field_height').value;
	var mines = document.getElementById('mines_count').value;
	csweep = new Sweep(width, height, mines);
	update_field();
	return false;
}

function restore_form() {
	document.getElementById('field_width' ).value = csweep.field.width;
	document.getElementById('field_height').value = csweep.field.height;
	document.getElementById('mines_count' ).value = csweep.mines;
}

function set_initial_page() {
	csweep = new Sweep(4, 4, 6);
	restore_form();
	apply_form();
	document.addEventListener('mousemove', update_popup);
	document.addEventListener('click', function(e) {
		var target = e.target;
		while (target !== null) {
			if (/sweep_field_/.test(target.id)) {
				return;
			}
			target = target.parentElement;
		}
		close_dialog();
	});
}

function solve() {
	var number_idxs = [];
	var bomb_idxs = [];
	var free_idxs = [];
	csweep.field.forEach(function (c, i, j) {
		var idx = i * csweep.field.width + j
			if (c.isNumber() || c.isEmpty()) {
				number_idxs.push(idx)
			} else if (c.isUnknown()) {
				free_idxs.push(idx)
			} else if (c.isBomb()) {
				bomb_idxs.push(idx);
			}
	});

	var w = Number(csweep.field.width);

	var A = create_matrix(number_idxs.length, free_idxs.length,
			function () { return false; });
	var B = create_map(number_idxs.length, function (idx) {
		var nidx = number_idxs[idx];
		return Number(csweep.field[
				Math.floor(nidx / w)][nidx % w].type); });

        var near = function (i, j) {
                return Math.abs(Math.floor(i / w) - Math.floor(j / w)) <= 1 &&
                        Math.abs((i % w) - (j % w)) <= 1
        };

	for (var i = 0; i < number_idxs.length; ++i) {
		var nidx = number_idxs[i];
		for (var j = 0; j < free_idxs.length; ++j) {
			if (near(nidx, free_idxs[j])) {
				A[i][j] = true;
			}
		}
		for (var j = 0; j < bomb_idxs.length; ++j) {
			if (near(nidx, bomb_idxs[j])) {
				--B[i];
			}
		}
	}

	var mines = csweep.mines - bomb_idxs.length;

	var res = solver.solve_for_rules(A, B, mines, mines);

	if (res) {
		var probs = create_matrix(csweep.field.height, w,
				function() { return 0; });

		for (var i = 0; i < bomb_idxs.length; ++i) {
			var bidx = bomb_idxs[i];
			probs[Math.floor(bidx / w)][bidx % w] = -1;
		}

		for (var i = 0; i < number_idxs.length; ++i) {
			var nidx = number_idxs[i];
			probs[Math.floor(nidx / w)][nidx % w] = -1;
		}

		for (var i = 0; i < free_idxs.length; ++i) {
			var fidx = free_idxs[i];
			for (var j = 0; j < res.length; ++j) {
				probs[Math.floor(fidx / w)][fidx % w]
					+= res[j][i];
			}
			probs[Math.floor(fidx / w)][fidx % w] /= res.length;
		}
		update_field(probs);
	}
}

function to_hex(c) {
	var hex = Math.floor(c).toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function get_color(prob) {
	return prob === -1 ? undefined : ("#" +
			to_hex(255 * Math.pow(prob, 1.1)) +
			to_hex(255 * (1 - Math.pow(prob, 0.4))) +
			to_hex(0));
}
