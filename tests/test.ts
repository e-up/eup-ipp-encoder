import test from 'tape';
import * as T from '../src/tags';
import * as ipp from '../src/index';

// Fix Buffer usage for TypeScript compatibility
const Buffer = require('buffer').Buffer;

const encoder = ipp.encoder;
const decoder = ipp.decoder;

test('encodingLength', function (t) {
  t.test('request minimal', function (t) {
    const len = encoder.encodingLength({ requestId: 0, operationId: 0 });
    t.deepEqual(len, 9);
    t.end();
  });

  t.test('response minimal', function (t) {
    const len = encoder.encodingLength({ requestId: 0, statusCode: 0 });
    t.deepEqual(len, 9);
    t.end();
  });

  t.test('request groups', function (t) {
    const date = new Date(2015, 11, 1, 1, 23, 45, 678);
    const obj = { // version + statusCode + operationId/requestId: +8
      requestId: 0,
      operationId: 0,
      groups: [
        { tag: 0, attributes: [ // +1 (9)
          { tag: T.KEYWORD, name: 'string', value: ['foo'] }, // +1+2+6+2+3=14 (23)
          { tag: T.KEYWORD, name: 'array', value: ['foo', 'bar'] }, // +1+2+5+2+3+1+2+0+2+3=21 (44)
          { tag: T.BOOLEAN, name: 'bool', value: [true] }, // +1+2+4+2+1=10 (54)
          { tag: T.ENUM, name: 'enum', value: [1] } // +1+2+4+2+4=13 (67)
        ] },
        { tag: 1, attributes: [ // +1 (68)
          { tag: T.KEYWORD, name: 'string', value: ['foo'] }, // +1+2+6+2+3=14 (82)
          { tag: T.TEXT_WITH_LANG, name: 'text-with-language', value: [{ lang: 'fr-CA', value: 'fou' }] }, // +1+2+18+2+2+5+2+3=35 (117)
          { tag: T.DATE_TIME, name: 'date-time', value: [date] } // +1+2+9+2+11=25 (142)
        ] }
      ]
    } // end tag: +1 (143)
    const len = encoder.encodingLength(obj);
    t.deepEqual(len, 143);
    t.end();
  });

  t.test('response groups', function (t) {
    const date = new Date(2015, 11, 1, 1, 23, 45, 678);
    const obj = { // version + statusCode + operationId/requestId: +8
      requestId: 0,
      statusCode: 0,
      groups: [
        { tag: 0, attributes: [ // +1 (9)
          { tag: T.KEYWORD, name: 'string', value: ['foo'] }, // +1+2+6+2+3=14 (23)
          { tag: T.KEYWORD, name: 'array', value: ['foo', 'bar'] }, // +1+2+5+2+3+1+2+0+2+3=21 (44)
          { tag: T.BOOLEAN, name: 'bool', value: [true] }, // +1+2+4+2+1=10 (54)
          { tag: T.ENUM, name: 'enum', value: [1] } // +1+2+4+2+4=13 (67)
        ] },
        { tag: 1, attributes: [ // +1 (68)
          { tag: T.KEYWORD, name: 'string', value: ['foo'] }, // +1+2+6+2+3=14 (82)
          { tag: T.TEXT_WITH_LANG, name: 'text-with-language', value: [{ lang: 'fr-CA', value: 'fou' }] }, // +1+2+18+2+2+5+2+3=35 (117)
          { tag: T.DATE_TIME, name: 'date-time', value: [date] } // +1+2+9+2+11=25 (142)
        ] }
      ]
    } // end tag: +1 (143)
    const len = encoder.encodingLength(obj);
    t.deepEqual(len, 143);
    t.end();
  });
});

test('encode', function (t) {
  t.test('request', function (t) {
    t.test('minimal', function (t) {
      const obj = {
        operationId: 0x0002,
        requestId: 42
      };
      const encoded = encoder.encode(obj);
      const expected = Buffer.from('010100020000002a03', 'hex');
      t.deepEqual(encoded, expected);
      t.end();
    });
  });

  t.test('response', function (t) {
    t.test('minimal', function (t) {
      const obj = {
        statusCode: 0x0503,
        requestId: 42
      };
      const encoded = encoder.encode(obj);
      const expected = Buffer.from('010105030000002a03', 'hex');
      t.deepEqual(encoded, expected);
      t.end();
    });

    t.test('custom version', function (t) {
      const obj = {
        version: { major: 2, minor: 0 },
        statusCode: 0x0000,
        requestId: 42
      };
      const encoded = encoder.encode(obj);
      const expected = Buffer.from('020000000000002a03', 'hex');
      t.deepEqual(encoded, expected);
      t.end();
    });

    t.test('groups', function (t) {
      const date = new Date(2015, 11, 1, 1, 23, 45, 678);
      const sign = date.getTimezoneOffset() > 0 ? '2d' : '2b';
      const zone = Buffer.alloc(2);
      zone.writeInt8(date.getTimezoneOffset() / 60, 0);
      zone.writeInt8(date.getTimezoneOffset() % 60, 1);
      const dateHex = '07df0c0101172d06' + sign + zone.toString('hex');

      const obj = {
        statusCode: 0x0000,
        requestId: 42,
        groups: [
          { tag: T.OPERATION_ATTRIBUTES_TAG, attributes: [
            { tag: T.KEYWORD, name: 'string', value: ['foo'] },
            { tag: T.KEYWORD, name: 'array', value: ['foo', 'bar'] },
            { tag: T.BOOLEAN, name: 'bool', value: [true] },
            { tag: T.ENUM, name: 'enum', value: [42] }
          ] },
          { tag: T.JOB_ATTRIBUTES_TAG, attributes: [
            { tag: T.KEYWORD, name: 'string', value: ['foo'] },
            { tag: T.NAME_WITH_LANG, name: 'name-with-language', value: [{ lang: 'fr-CA', value: 'fou' }] },
            { tag: T.DATE_TIME, name: 'date-time', value: [date] }
          ] }
        ]
      };
      const encoded = encoder.encode(obj);
      const expected = Buffer.from(
        '0101' + // version
        '0000' + // statusCode
        '0000002a' + // requestId
        '01' + // delimiter tag
          '44' + // value tag
            '0006' + // name length
            '737472696e67' + // name
            '0003' + // value length
            '666f6f' + // value
          '44' + // value tag
            '0005' + // name length
            '6172726179' + // name
            '0003' + // value length
            '666f6f' + // value
          '44' + // value tag
            '0000' + // name length
            '' + // name
            '0003' + // value length
            '626172' + // value
          '22' + // value tag
            '0004' + // name length
            '626f6f6c' + // name
            '0001' + // value length
            '01' + // value
          '23' + // value tag
            '0004' + // name length
            '656e756d' + // name
            '0004' + // value length
            '0000002a' + // value
        '02' + // delimiter tag
          '44' + // value tag
            '0006' + // name length
            '737472696e67' + // name
            '0003' + // value length
            '666f6f' + // value
          '36' + // value tag
            '0012' + // name length
            '6e616d652d776974682d6c616e6775616765' + // name
            '000c' + // value length
            '0005' + // sub-value length
            '66722d4341' + // sub-value
            '0003' + // sub-value length
            '666f75' + // name
          '31' + // value tag
            '0009' + // name length
            '646174652d74696d65' + // name
            '000b' + // value length
            dateHex + // value
        '03', // end of attributes tag
        'hex');
      t.deepEqual(encoded, expected);
      t.end();
    });
  });
});

test('decode', function (t) {
  t.test('request', function (t) {
    t.test('minimal', function (t) {
      const data = Buffer.from('0101000a0000002a03', 'hex');
      const expected = {
        version: { major: 1, minor: 1 },
        operationId: 10,
        requestId: 42,
        groups: []
      };
      const decoded = decoder.decodeRequest(data);
      t.deepEqual(decoded, expected);
      t.end();
    });

    t.test('truncated', function (t) {
      const data = Buffer.from('0101000a0000002a', 'hex');
      t.throws(function () {
        decoder.decodeRequest(data);
      });
      t.end();
    });
  });
});

test('encode -> decode', function (t) {
  const encodeDate = new Date(2015, 11, 1, 1, 23, 45, 678);
  const decodeDate = new Date(2015, 11, 1, 1, 23, 45, 600);
  const obj = {
    version: { major: 1, minor: 0 },
    statusCode: 0x0000,
    requestId: 42,
    groups: [
      { tag: T.OPERATION_ATTRIBUTES_TAG, attributes: [
        { tag: T.KEYWORD, name: 'string', value: ['foo'] },
        { tag: T.KEYWORD, name: 'array', value: ['foo', 'bar'] },
        { tag: T.BOOLEAN, name: 'bool', value: [true] },
        { tag: T.ENUM, name: 'enum', value: [42] }
      ] },
      { tag: T.JOB_ATTRIBUTES_TAG, attributes: [
        { tag: T.KEYWORD, name: 'string', value: ['foo'] },
        { tag: T.DATE_TIME, name: 'date-time', value: [encodeDate] }
      ] }
    ]
  };
  const encoded = Buffer.concat([encoder.encode(obj), Buffer.from('foo')]);
  (obj.groups as any)[1].attributes[1].value[0] = decodeDate;
  const decoded = decoder.decodeResponse(encoded);
  t.deepEqual(decoded, obj);
  t.end();
});
