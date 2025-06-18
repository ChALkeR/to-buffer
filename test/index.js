'use strict';

var test = require('tape');
var availableTypedArrays = require('available-typed-arrays')();
var forEach = require('for-each');
var typedArrayBuffer = require('typed-array-buffer');
var SafeBuffer = require('safe-buffer').Buffer;

var toBuffer = require('../');
var fixtures = require('./fixtures.json');

test('buffer returns buffer', function (t) {
	t.deepEqual(toBuffer(new Buffer('hi')), new Buffer('hi'));
	t.end();
});

test('string returns buffer', function (t) {
	t.deepEqual(toBuffer('hi'), new Buffer('hi'));
	t.end();
});

test('string + enc returns buffer', function (t) {
	t.deepEqual(toBuffer('6869', 'hex'), new Buffer('hi'));
	t.end();
});

test('array returns buffer', function (t) {
	t.deepEqual(toBuffer([104, 105]), new Buffer('hi'));

	forEach([-1, 256, NaN, 4.2, Infinity], function (nonByte) {
		t['throws'](
			function () { toBuffer([0, 42, nonByte]); },
			RangeError,
			nonByte + ': arrays with out-of-bounds byte values throw'
		);
	});

	t.end();
});

test('other input throws', function (t) {
	try {
		toBuffer(42);
	} catch (err) {
		t.deepEqual(err.message, 'The "data" argument must be a string, an Array, a Buffer, a Uint8Array, or a DataView.');
		t.end();
	}
});

test('handle all TA types', function (t) {
	forEach(availableTypedArrays, function (type) {
		var TA = global[type];
		if (!(type in fixtures)) {
			t.fail('No fixtures for ' + type);
			return;
		}

		var input = fixtures[type].input;
		if (typeof input[0] === 'string') {
			for (var i = 0; i < input.length; i++) {
				input[i] = BigInt(input[i]);
			}
		}

		t.deepEqual(
			toBuffer(new TA(input)),
			new Buffer(fixtures[type].output),
			type + ' should be converted to Buffer correctly'
		);
	});

	t.test('TA subset view on another one', { skip: typeof Float64Array === 'undefined' || typeof Uint8Array === 'undefined' }, function (st) {
		var arr = new Uint8Array(1e3);
		var buffer = typedArrayBuffer(arr);
		var subsetLength = 5;
		var arr2 = new Float64Array(buffer, 800, subsetLength);

		st.deepEqual(
			toBuffer(arr2),
			SafeBuffer.alloc(subsetLength * 8, buffer),
			'Uint8Array subset view on Float64Array should be converted to Buffer correctly'
		);

		st.end();
	});

	t.end();
});
