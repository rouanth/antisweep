function isInt(n) {
	return Number(n) === n && n % 1 === 0;
}

function create_map(n, func) {
        var result = [];
        var i;
        for (i = 0; i < n; ++i) {
                result.push(func(i));
        }
        return result;
}

function create_matrix(n, m, func) {
        var i, j;
        var result = create_map(n, function(i) {
                return create_map(m, function (j) {
                        return func(i, j);
                });
        });
        result.width = m;
        result.height = n;
        result.forEach = function (callback, thisArg) {
                var that = thisArg || this;
                for (i = 0; i < result.height; ++i) {
                        for (j = 0; j < result.width; ++j) {
                                callback(that[i][j], i, j, that);
                        }
                }
        };
        return result;
}

function copy_matrix(matr) {
        var i, j;
        var result = [];
        result.width  = matr.width;
        result.height = matr.height;
        for (i = 0; i < matr.height; ++i) {
                result[i] = [];
                for (j = 0; j < matr.width; ++j) {
                        result[i][j] = matr[i][j];
                }
        }
        result.matrForEach = matr.matrForEach;
        return result;
}

function copy_matrix_wo_col(matr, col) {
	return create_matrix(matr.height, matr.width - 1, function(i, j) {
		return j < col ? matr[i][j] : matr[i][j+1];
	});
}

function copy_matrix_wo_row(matr, row) {
	return create_matrix(matr.height - 1, matr.width, function(i, j) {
		return i < row ? matr[i][j] : matr[i+1][j];
	});
}

function cr_const(n) {
	return function() {
		return n;
	};
}
