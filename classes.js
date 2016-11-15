function Sweep(width, height, mines) {
	this.mines = +mines;
	this.field = create_matrix(height, width,
			function() { return new Cell('q') });
}

function Cell(type) {
	function is_of_type (type) {
		return function () {
			return this.type === type
		}
	}

	this.type = type;
	this.isUnknown = is_of_type('q');
	this.isEmpty   = is_of_type('0');
	this.isFree    = is_of_type('f');
	this.isBomb    = is_of_type('b');
	this.isNumber  = function () {
		var eln = parseInt(this.type, 10);
		return !isNaN(eln) && (eln !== 0)
	};
}

function Position2D(row, col) {
	this.row = +row;
	this.col = +col;
	this.toString = function () { return '(' + row + ', ' + col + ')' };
}
