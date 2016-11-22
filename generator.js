function generate (width, height, mines, seed) {
	if (mines > width * height || width < 0 || height < 0 || !seed ||
			seed >= (1 <<< 31) - 1) {
		return null;
	}

	var prime = (1 <<< 31) - 1;
	var field = create_matrix(height, width, function() { return 0; });

	for (var i = 0; i < mines; ++i) {
		var idx = (i + seed) * prime % width * height;
		field[Math.floor(idx / width)][idx % width] = true;
	}

	return field;
}
