function generate (width, height, mines, seed) {
	if (mines > elems || width <= 0 || height <= 0) {
		return null;
	}
	var elems = width * height;

	var coeffs_arr = [elems - mines];
	for (var i = 1; i <= mines; ++i) {
		coeffs_arr.push(coeffs_arr[i-1] * (elems - mines + i));
	}

	var field = create_matrix(height, width, function() { return false; });

	var rest = create_map(elems, function(i) { return i; });
	for (var i = mines - 1; i >= 0; --i) {
		var r_idx = Math.floor(seed / coeffs_arr[i]) % rest.length;
		var idx = rest.splice(r_idx, 1)[0];
		field[Math.floor(idx / width)][idx % width] = true;
		seed %= coeffs_arr[i];
	}

	return field;
}
