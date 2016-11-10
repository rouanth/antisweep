function test () {
	var B = create_map(3, function(){return 1});
	B[1] = 2;

	/* AX = B :
	 * x 1 2 1 x
	 * x x x x x
	 */
	var A = create_matrix(3, 8, function(){return false});
	A[0][0] = A[0][1] = A[0][2] = A[0][3] = true;
	A[1][2] = A[1][3] = A[1][4] = true;
	A[2][3] = A[2][4] = A[2][5] = A[2][6] = true;

	/* CX = B, slightly artificial example:
	 * 1 _ 1
	 * x 2 x
	 * _ x _
	 */
	var C = create_matrix(3, 4, function(){return false});
	C[0][1] = true;
	C[1][1] = C[1][2] = C[1][3] = true;
	C[2][2] = true;

	/* DX = B:
	 * 1 2 x x 1
	 * _ x x x x
	 */
	var D = create_matrix(3, 6, function(){return false});
	D[0][0] = true;
	D[1][0] = D[1][1] = D[1][2] = true;
	D[2][3] = D[2][4] = D[2][5] = true;

	return {
		solve_ab : solve_for_rules(A, B, 2, 3),
		elim_cb  : eliminate_obvious_rules(C, B),
		split    : split_at_compontents(D, B)
	};
}

function eliminate_obvious_rules (A, B) {
	var res = [];
	var aWork = copy_matrix(A);
	var bWork = B.slice();

	var vars_set = 0;
	var obvious;
	do {
		obvious = false;

		for (var i = 0; i < aWork.height; ++i) {
			var rowCnt = 0;
			for (var j = 0; j < aWork.width; ++j) {
				rowCnt += aWork[i][j];
			}
			if ((bWork[i] > rowCnt) || (bWork[i] < 0)) {
				return null;
			}
			if (bWork[i] && (bWork[i] != rowCnt)) {
				continue;
			}

			obvious = true;
			for (var j = 0; j < aWork.width + vars_set; ++j) {
				if (!aWork[i][j-vars_set]) {
					continue;
				}
				res[j] = bWork[i] != 0;
				for (var z = 0; z < aWork.height; ++z) {
					if (aWork[z][j-vars_set] && res[j]) {
						--bWork[z];
					}
				}
				aWork = copy_matrix_wo_col(aWork, j-vars_set);
				++vars_set;
			}
			bWork.splice(i, 1);
			aWork = copy_matrix_wo_row(aWork, i--);
		}
	} while (obvious);

	return {
		A : aWork,
		B : bWork,
		res : res
	}
}

function split_at_compontents (A, B) {
	var res = [];
	var assigned = Object.create(null);
	for (var i = 0; i < A.height; ++i) {
		if (i in assigned)
			continue;

		var comp = [];
		var curr = Object.create(null);
		for (var j = 0; j < A.width; ++j) {
			if (A[i][j]) {
				curr[j] = true;
			}
		}

		for (var k = i; k < A.height; ++k) {
			if (k in assigned)
				continue;

			for (var j = 0; j < A.width; ++j) {
				if (curr[j] && A[k][j]) {
					comp.push(k);
					assigned[k] = true;
					break;
				}
			}
		}

		var a = create_matrix(comp.length, A.width, function (i, j) {
			return A[comp[i]][j];
		});

		var b = create_map(comp.length, function(i) {
			return B[comp[i]];
		});

		res.push({a: a, b: b});
	}
	return res;
}

/* Find all possible solutions for A * X = B assuming that both a_ij and x_i
 * are in {true, false}.
 *
 * A, B      -- matrices to be solved;
 * {min|max} -- if a number, sum of all x_i must be {more|less} than the value
 *              of this parameter.
 * */

function solve_for_rules (A, B, min, max) {
	var min = isInt(min) ? min : -1;
	var max = isInt(max) ? max : Infinity;

	if (B.length != A.height) {
		throw {
			name : 'extended_matrix_incorrect',
			text : B + ' can\'t be an extension of ' + A +
				' as their dimensions don\'t match'
		}
	}

	console.log({A : A, B : B, min : min, max : max});

	var obvious = eliminate_obvious_rules(A, B);
	console.log({After_elimination : obvious});
	if (obvious === null) {
		return [];
	}
	var aWork = obvious.A;
	var bWork = obvious.B;
	var resTempl = obvious.res;

	var foundMines = 0;
	for (var i = 0; i < resTempl.length; ++i) {
		foundMines += i in resTempl && resTempl[i];
	}
	min -= foundMines;
	max -= foundMines;

	if (max < 0 || aWork.width < min) {
		return [];
	}

	if (aWork.width === 0) {

		for (var i = 0; i < B.length; ++i) {
			if (B[i] != 0) {
				return [];
			}
		}

		console.log('Success!');
		return [resTempl];
	}

	var res = [];

	var splitIdx = 0;

	var aWoSplit = copy_matrix_wo_col(aWork, splitIdx);

	/* Assuming the selected variable is `true` */
	{
		console.log('TRUE');
		var newB = create_map(bWork.length, function(i) {
			return A[i][splitIdx] ? bWork[i] - 1 : bWork[i];
		});
		var r = solve_for_rules (aWoSplit, newB, min - 1, max - 1);
		if (r.length > 0) {
			res = res.concat(r.map(function(el) {
				el.splice(splitIdx, 0, true); return el;}));
		}
		console.log('OUT_TRUE');
	}
	/* Assuming it's `false` */
	{
		console.log('FALSE');
		var newB = bWork;
		var r = solve_for_rules (aWoSplit, newB, min, max);
		if (r.length > 0) {
			res = res.concat(r.map(function(el) {
				el.splice(splitIdx, 0, false); return el;}));
		}
		console.log('OUT_FALSE');
	}

	console.log({res : res, resTempl : resTempl});
	res = res.map(function(el) {
		for (var i = 0; i < resTempl.length; ++i) {
			if (i in resTempl) {
				el.splice(i, 0, resTempl[i]);
			}
		}
		return el;
	});

	return res;

}

