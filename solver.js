function test () {

	function display(name, results) {
		console.log(name + ": " + results.map(
					function(c) { if (c) {
						return "."
					} else {
						return "x"
					}}).join('')
			   );
	}

	function check_results(solution, correct) {
		return solution.map(function(x) {
			x.toString()
		}).sort().toString() === correct.map(function(x) {
			x.toString()
		}).sort().toString();
	}

	/* AX = B :
	 * x 1 2 1 x x
	 * x x x x x
	 */
	var A = create_matrix(3, 8, function(){return false});
	A[0][0] = A[0][1] = A[0][2] = A[0][3] = true;
	A[1][2] = A[1][3] = A[1][4] = true;
	A[2][3] = A[2][4] = A[2][5] = A[2][6] = true;

	var B = create_map(3, function(){return 1});
	B[1] = 2;

	var solve_ab = solve_for_rules(A, B, 2, 3);
	var solve_ab_cond = check_results(solve_ab,
			[[false, false, true, false, true, false, false, true],
			[false, false, true, false, true, false, false, false]]
			);

	/* CX = D :
	 * 2 x x
	 * x x 2
	 */
	var C = create_matrix(2, 4, function(){return true});
	C[0][1] = false;
	C[1][2] = false;

	var D = create_map(2, function(){return 2});

	var solve_cd = solve_for_rules(C, D, 3, 3);
	var solve_cd_cond = check_results(solve_cd,
			[[true, true, true, false],
			[false, true, true, true]]);

	/* EX = F :
	 * x 1 x
	 */
	var E = create_matrix(1, 2, function(){return true});
	var F = create_map(1, function(){return 1});

	var solve_ef = solve_for_rules(E, F, 1, 1);
	var solve_ef_cond = check_results(solve_ef,
			[[true, false], [false, true]]);

	display("Simple tests", [solve_ab_cond, solve_cd_cond, solve_ef_cond]);

	/* CX = B, slightly artificial example:
	 * 1 _ 1
	 * x 2 x
	 * _ x _
	 */
	var C = create_matrix(3, 3, function(){return false});
	C[0][0] = true;
	C[1][0] = C[1][1] = C[1][2] = true;
	C[2][1] = true;

	var elim_cb = eliminate_obvious_rules(C, B);
	var elim_cb_cond = elim_cb.A.height === 0 && elim_cb.B.length === 0 &&
		elim_cb.res.toString() === "true,true,false";

	display("Elimination of obvious rules", [elim_cb_cond]);

	/* DX = B:
	 * 1 2 x x 1
	 * _ x x x x
	 */
	var D = create_matrix(3, 6, function(){return false});
	D[0][0] = true;
	D[1][0] = D[1][1] = D[1][2] = true;
	D[2][3] = D[2][4] = D[2][5] = true;

	return {
		solve_ab : solve_ab,
		elim_cb  : elim_cb,
		split    : split_at_components(D, B)
	};
}

function eliminate_obvious_rules (A, B) {
	var res = [];
	var aWork = copy_matrix(A);
	var bWork = B.slice();

	var idxs = create_map(aWork.width, function(i) { return i });

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
			if (bWork[i] && (bWork[i] !== rowCnt)) {
				continue;
			}

			obvious = true;
			for (var j = 0; j < aWork.width; ++j){
				if (!aWork[i][j]) {
					continue;
				}
				res[idxs[j]] = bWork[i] !== 0;
				if (res[idxs[j]]) {
					for (var z = 0; z < aWork.height; ++z) {
						if (aWork[z][j]) {
							--bWork[z];
						}
					}
				}
				aWork = copy_matrix_wo_col(aWork, j);
				idxs = create_map(aWork.width, function(i) {
					return idxs[i + (i >= j)];
				});
				--j;
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

function split_at_components (A, B) {
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

		var ixs = comp;

		res.push({a: a, b: b, ixs: ixs});
	}
	return res;
}

function partition_split_idx (A, B) {
	for (var idx = 0; idx < A.width; ++idx) {
		for (var r = 0; r < A.height; ++r) {
			if (A[r][idx])
				return idx;
		}
	}
	return null;
}

function combinations (n, kmin, kmax) {
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

function merge (arr1, arr2) {
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

	if (aWork.width === 0 || aWork.height === 0) {

		for (var i = 0; i < bWork.length; ++i) {
			if (bWork[i] !== 0) {
				return [];
			}
		}

		console.log('Success!');
		var combs = combinations(aWork.width, min, max);
		return combs.map(function(el) { return merge(resTempl, el); });
	}

	var res = [];

	var splitIdx = partition_split_idx(aWork, bWork);
	var maxAtIdx = Math.max.apply(null, create_map(aWork.height,
				function(j) { return aWork[j][splitIdx]; }));

	var aWoSplit = copy_matrix_wo_col(aWork, splitIdx);

	for (var i = maxAtIdx; i >= 0; --i) {
		var newB = create_map(bWork.length, function(j) {
			return bWork[j] - (aWork[j][splitIdx] ? i : 0);
		});
		console.log({i: i, newB: newB, splitIdx: splitIdx});
		var r = solve_for_rules (aWoSplit, newB, min - i, max - i);
		if (r.length > 0) {
			res = res.concat(r.map(function(el) {
				el.splice(splitIdx, 0, i); return el;}));
		}
		console.log({Out: i, res: res});
	}

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

