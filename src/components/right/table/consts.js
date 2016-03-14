"use strict";

var def = require('../../../utils/define')(exports)


def('TABLE', 'WIDTH', 1028);
def('TABLE', 'HEIGHT', 800);
def('TABLE', 'COLUMN_WIDTHS', [
    exports.TABLE.WIDTH * .02,
    exports.TABLE.WIDTH * .19,
    exports.TABLE.WIDTH * .09,
    exports.TABLE.WIDTH * .09,
    exports.TABLE.WIDTH * .09,
    exports.TABLE.WIDTH * .13,
    exports.TABLE.WIDTH * .13,
    exports.TABLE.WIDTH * .13,
    exports.TABLE.WIDTH * .13,
]);
def('TABLE', 'COLUMN_STARTS', exports.TABLE.COLUMN_WIDTHS.map((w, i, cols) => {
  return cols.slice(0, i).reduce((a, b) => a + b, 0);
}));

def('TABLE_HEADER', 'HEIGHT', 36)
def('TABLE_HEADER', 'BGCOLOR', '#f0f0f0')
def('TABLE_HEADER', 'PL', 8)


def('TABLE_BODY', 'HEIGHT', exports.TABLE.HEIGHT - 2 * exports.TABLE_HEADER.HEIGHT)
def('TABLE', 'NUM_VISIBLE_ROWS', 20);
def('TABLE', 'ROW', 'HEIGHT', exports.TABLE_BODY.HEIGHT / exports.TABLE.NUM_VISIBLE_ROWS);
