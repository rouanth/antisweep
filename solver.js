function create_map(n, func) {
        return Array.apply(null, new Array(+n)).map(function(x, index, arr) {
                return func(index);
        });
}

function foreach_obj(obj, func) {
        for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                        func(obj[key], key);
                }
        }
}

function create_matrix(n, m, func) {
        var result = create_map(n, function(i) {
                return create_map(m, function (j) {
                        return func(i, j);
                })
        });
        result.width = m;
        result.height = n;
        result.matrForEach = function (callback, thisArg) {
                var that = thisArg ? thisArg : this;
                for (var i = 0; i < result.height; ++i) {
                        for (var j = 0; j < result.width; ++j) {
                                callback(that[i][j], i, j, that);
                        }
                }
        };
        return result;
}

function copy_matrix(matr) {
        var result = [];
        result.width  = matr.width;
        result.height = matr.height;
        for (var i = 0; i < matr.height; ++i) {
                result[i] = [];
                for (var j = 0; j < matr.width; ++j) {
                        result[i][j] = matr[i][j];
                }
        }
        result.matrForEach = matr.matrForEach;
        return result;
}

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

var solver = {};

solver.solve = function (swp) {
        try {
                var calc = this.calculate(swp);
        } catch (e) {
                alert(e.message);
                return
        }
        calc.new_field.matrForEach(function (curr, i, j) {
                if (!curr.isFree()) {
                        swp.field[i][j] = curr;
                }
        });
        return calc.probs;
}

function fold_around (mi, mj, Mi, Mj, i, j, a, accFunc) {
        if ((mi != i) && (mj != j)) { a = accFunc(a, i-1, j-1) }
        if ((mi != i) && (Mj != j)) { a = accFunc(a, i-1, j+1) }
        if ((Mi != i) && (mj != j)) { a = accFunc(a, i+1, j-1) }
        if ((Mi != i) && (Mj != j)) { a = accFunc(a, i+1, j+1) }
        if ((mi != i)             ) { a = accFunc(a, i-1, j  ) }
        if ((Mi != i)             ) { a = accFunc(a, i+1, j  ) }
        if (             (mj != j)) { a = accFunc(a, i  , j-1) }
        if (             (Mj != j)) { a = accFunc(a, i  , j+1) }
        return a;
}

function Lead (required, unknowns) {
        this.required = +required;
        this.unknowns = unknowns;
}

solver.get_rules = function (field) {
        var w = field.width;
        var h = field.height;

        function cell_name (i, j) {
                return [i, j].join(';');
        }

        function acc_f (el, cell) {
                if (!el.isBomb() && !el.isUnknown()) {
                        return function (a) { return a }
                }

                return function (a, i, j) {
                        var e = field[i][j];
                        if (!e.isNumber() && !e.isEmpty()) {
                                return a;
                        }

                        var name = cell_name(i, j);
                        if (!a[name]) {
                                a[name] = new Lead(e.type, []);
                                a[name].pos = new Position2D(i, j);
                        }

                        if (el.isBomb()) {
                                --a[name].required;
                        } else {
                                a[name].unknowns.push(cell);
                                cell.used = true;
                        }
                        return a;
                }
        }

        var unknowns = [];
        var leads    = {};
        var free_unknowns = [];
        field.matrForEach(function (el, i, j) {
                if (!el.isUnknown() && !el.isBomb()) {
                        return
                }
                var cell = new Position2D(i, j);
                cell.used = false;
                leads = fold_around(0, 0, h-1, w-1, i, j, leads,
                                acc_f(el, cell));
                if (el.isUnknown()) {
                        (cell.used ? unknowns : free_unknowns).push(cell);
                }
                delete cell.used;
        });

        this.delete_empty_rules();

        return {
                unknowns : unknowns,
                leads    : leads,
                free_unknowns : free_unknowns
        }
}

solver.delete_empty_rules = function (leads) {
        foreach_obj(leads, function (lead, key) {
                // Check for validity
                if ((lead.required > lead.unknowns.length) ||
                                (lead.required < 0)) {
                        throw {
                                name    : 'unexpected_cell_type',
                                pos     : lead.pos,
                                message : 'The vicinity of the cell ' +
                                        lead.pos + ' conflicts with its type'
                        }
                }
                // Remove the rules that can't provide any new information
                if (!lead.required && !lead.unknowns.length) {
                        delete leads[key];
                }
        });
}

solver.guess_cell_types = function(field) {
        var h = field.height;
        var w = field.width;

        function near_unknown_f (a, i, j) {
                var el = field[i][j];
                a.near_unknown = a.near_unknown || el.isUnknown();
                if (el.isBomb()) {
                        ++a.mines_around;
                }
                return a
        }

        field.matrForEach(function (el, i, j) {
                var el = field[i][j];
                if (!el.isFree()) {
                        return
                }

                var info = {
                        near_unknown : false,
                        mines_around : 0
                };

                info = fold_around(0, 0, h-1, w-1, i, j, info,
                                near_unknown_f);

                field[i][j].type = info.near_unknown ? 'q' :
                        info.mines_around + "";
        });

        return field;
}

solver.calculate = function(swp) {
        var field = copy_matrix(swp.field);
        var totalUnknown = 0;

        var obvious;
        var rules = this.get_rules(field);
        do {
                obvious = 0;
                foreach_obj(rules.leads, function(lead) {
                        if (lead.required && (lead.required !==
                                                lead.unknowns.length))
                        { return }

                        var type = lead.required ? 'b' : 'f';
                        lead.unknowns.forEach(function (e) {
                                field[e.row][e.col] = new Cell(type);
                        });
                        obvious += lead.unknowns.length;
                });
                rules = this.get_rules(field);
        } while (obvious);

        var bombs_found = 0;

        var probs = create_matrix(field.height, field.width, function (i, j) {
                var el = field[i][j];
                if (el.isUnknown()) {
                        return -2;
                } else if (el.isBomb()) {
                        ++bombs_found;
                        return 100;
                } else if (el.isFree()) {
                        return 0;
                } else {
                        return -1;
                }
        });
        var res = this.calculate_probabilities(rules, swp.mines - bombs_found);
        var norm = this.normalized(res, rules.free_unknowns.length);
        var update_probs = function (is_bound) {
                return function (val, index) {
                        var curr_prob = is_bound ? norm.bound[index] :
                                norm.free;
                        probs[val.row][val.col] = curr_prob;
                        if (curr_prob === 0) {
                                field[val.row][val.col].type = 'f';
                        } else if (curr_prob === 100) {
                                field[val.row][val.col].type = 'b';
                        }
                }
        };
        rules.unknowns.forEach(update_probs(true));
        rules.free_unknowns.forEach(update_probs(false));

        return {
                probs : probs,
                new_field : this.guess_cell_types(field)
        }
}

solver.count_mines = function (field) {
        var result = 0;
        field.matrForEach(function (el) {
                if (el.isBomb()) {
                        ++result;
                }
        });
        return result;
}

solver.is_correct = function (rules, mines_left) {
        var result = true;
        foreach_obj(rules.leads, function(lead) {
                var consider = true;
                var current = (lead.unknowns.filter(function (val) {
                        consider = consider && val.traversed;
                        return val.set
                }).length === lead.required);
                if (consider) {
                        result = result && current;
                }
        });
        return result;
}

function combinations (n, k) {
        if (n < k) {
                return 0;
        }

        var i;
        var r = 1;
        for (i = k + 1; i <= n; ++i) {
                r *= i;
        }
        for (i = 1; i <= (n - k); ++i) {
                r /= i;
        }
        return r;
}

solver.calculate_probabilities = function (rules, mines_left, index) {
        index = index ? index : 0;
        var result = {
                probs : create_map(rules.unknowns.length, function () {
                        return 0
                }),
                prob_free : 0,
                total : 0
        }

        if (index === rules.unknowns.length) {
                if ((rules.free_unknowns.length < mines_left) || 
                                (!this.is_correct(rules, mines_left)))
                { return result }

                var modifier = combinations(rules.free_unknowns.length,
                                mines_left);

                var probs = [];
                rules.unknowns.forEach(function (val, index) {
                        if (val.set) {
                                result.probs[index] += modifier;
                        }
                });

                result.prob_free += mines_left * modifier;
                result.total += modifier;
                return result;
        }

        var s;
        var curr = rules.unknowns[index];

        if (!this.is_correct(rules, mines_left)) {
                return result;
        }

        curr.traversed = true;

        if (mines_left) {
                curr.set = true;
                --mines_left;
                s = this.calculate_probabilities(rules, mines_left,
                                index + 1);
                result.total += s.total;
                s.probs.forEach(function (val, index) {
                        result.probs[index] += val;
                });
                result.prob_free += s.prob_free;
                curr.set = false;
                ++mines_left;
        }

        s = this.calculate_probabilities(rules, mines_left,
                        index + 1);
        result.total += s.total;
        result.prob_free += s.prob_free;
        s.probs.forEach(function (val, index) {
                result.probs[index] += val;
        });

        curr.traversed = false;
        return result;
}

solver.normalized = function (s, free_unknowns_cnt) {
        return {
                bound : s.probs.map(function (val) {
                        return val * 100 / s.total;
                }),
                free  : s.prob_free * 100 / (s.total * free_unknowns_cnt)
        }
}
