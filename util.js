function isInt(n) {
	return Number(n) === n && n % 1 === 0;
}

var fact_arr = [1, 1];
function factorial(n) {
	for (var i = 2; i <= n; ++i) {
		fact_arr[i] = i * fact_arr[i-1];
	}
	return fact_arr[n];
}

function permutation(arr, n) {
	var perm = [];
	var rest = arr.slice();
	for (var i = 0; i < arr.length; ++i) {
		var f = factorial(arr.length - i - 1);
		var pos = Math.floor(n / f);
		n = n % f;
		perm.push(rest.splice(pos, 1)[0]);
	}

	return perm;
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

function combinations_arr (n, kmin, kmax) {
	if (kmax < 0 || n < kmin) {
		return [];
	}

	if (n === 0) {
		return [[]];
	}

	if (n === 1) {
		var res = [];
		if (kmax > 0) {
			res.push([1]);
		}
		if (kmin <= 0) {
			res.push([0]);
		}
		console.log(res);
		return res;
	}

	var combsPlus = combinations (n-1, kmin-1, kmax-1);
	var combsMin  = combinations (n-1, kmin,   kmax);

	combsPlus.map(function (el) { el.splice(0, 0, 1); return el; });
	combsMin.map( function (el) { el.splice(0, 0, 0); return el; });
	return combsPlus.concat(combsMin);
}

function merge_in (arr1, arr2) {
	var s = arr1.slice();
	var lp = 0;
	for (var i = 0; i < arr2.length; ++i) {
		while (lp in s) {
			++lp;
		}
		s[lp] = arr2[i];
	}
	return s;
}
