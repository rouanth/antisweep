Antisweeper
===========

Minesweeper solver for browser. Requires JavaScript to be enabled.

Usage
-----

Go to https://rouanth.github.io/antisweep/. Usage should be evident. If it
isn't, please open an issue and express your thoughts on how the interface
could be modified to become more intuitive.

Algorithm
---------

The currently used algorithm is as follows:

  1. Find all the cells that are adjacent to a cell with a number which is most
     probably provided by the user.
  2. If the current configuration satisfies the boundaries imposed by the
     numbers, assign to it a weight which equals to a number of k-combinations
     from a set of cells which are not adjacent to a numbered cell where `k` is
     the number of remaining mines.
     If, on the other hand, the current configuration can't satisfy the
     boundaries, we assign the value of 0 to the current configuration.
     In both cases we return these values. Otherwise, if the current
     configuration is ambiguous, we proceed.
  3. Select the next cell that is adjacent to cells with numbers and repeat
     steps 2-4 twice: assuming that there is a bomb in this cell and that there
     isn't. If no such cells remain, then the algorithm has terminated one way
     or the other in the previous step.
  4. Return the sum of the configuration weights computed by children.

### Why another algorithm is needed

The existing algorithm is horrendous for many reasons, the main one being that
it's tightly entangled with representation of the field as a matrix. It would
be significantly more flexible were it based on linear equations because they
more transparently allow for:

  * Grouping together cells that are interchangeable. It is implemented in the
    existing algorithm in a specific case of cells that don't have any
    boundaries, but the number of cells we need to analyze can be nearly
    halved, which would mean that we only need to spend only a square root of 
    the time that would be required otherwise.

  * Separately calculating the connectivity components of the resulting graph.
    If we can divide all the cells to partitions such that every potentially
    mined cell is in the same class as the numbered cells it's adjacent to,
    then we can analyze these partitions independently. This, too, can often
    yield significant execution time decrease. We can't accurately estimate the
    gain, but in many cases it can transform `2^n` to `m * n^2` where `n` is
    the number of mines and `m` is the amount of numbered cells adjacent to
    potentially mined ones.

  * Using graph isomorphism to find solution for each graph only once and then
    use the cached results.
