import * as C from './constants';
import { statusCodes } from './status-codes';
import { Buffer } from 'node:buffer';

export const CONSTANTS = C;
export { statusCodes as STATUS_CODES };

export interface Version {
  major: number;
  minor: number;
}

export interface Attribute {
  tag: number;
  name: string;
  value: any[];
}

export interface AttributeGroup {
  tag: number;
  attributes: Attribute[];
}

export interface IPPBase {
  version?: Version;
  requestId: number;
  groups?: AttributeGroup[];
  data?: Buffer;
  [key: string]: any;
}

export interface IPPRequest extends IPPBase {
  operationId: number;
}

export interface IPPResponse extends IPPBase {
  statusCode: number;
}

export interface Encoder<T extends IPPBase> {
  decode: (buf: Buffer, start?: number, end?: number) => T;
  encode: (obj: T, buf?: Buffer, offset?: number) => Buffer;
  encodingLength: (obj: T) => number;
}

export interface LangStrValue {
  lang: string;
  value: string;
}

interface DecodeFunction {
  (buf: Buffer, start?: number, end?: number): IPPBase;
  bytes: number;
}

interface EncodeFunction {
  (obj: IPPBase, buf?: Buffer, offset?: number): Buffer;
  bytes: number;
}

// Define decode function with explicit type
const _decode: DecodeFunction = function(buf: Buffer, start?: number, end?: number) {
  if (!start) start = 0;
  if (!end) end = buf.length;
  let offset = start;

  const obj: IPPBase & { _oprationIdOrStatusCode: number; version: Version; groups: AttributeGroup[] } = {
    version: { major: 0, minor: 0 },
    groups: [],
    _oprationIdOrStatusCode: 0,
    requestId: 0
  };

  obj.version.major = buf.readInt8(offset++);
  obj.version.minor = buf.readInt8(offset++);
  obj._oprationIdOrStatusCode = buf.readInt16BE(offset);
  offset += 2;
  obj.requestId = buf.readInt32BE(offset);
  offset += 4;

  // attribute groups
  let tag = buf.readInt8(offset++); // delimiter-tag
  while (tag !== C.END_OF_ATTRIBUTES_TAG && offset < end) {
    const group: AttributeGroup = { tag, attributes: [] };

    // attribute-with-one-value or additional-value
    tag = buf.readInt8(offset++); // value-tag
    while (tag > 0x0f) {
      const name = str.decode(buf, offset);
      offset += (str.decode as any).bytes;

      let val: any;
      switch (tag) {
        case C.INTEGER:
          val = tint.decode(buf, offset);
          offset += (tint.decode as any).bytes;
          break;
        case C.BOOLEAN:
          val = tbool.decode(buf, offset);
          offset += (tbool.decode as any).bytes;
          break;
        case C.ENUM:
          val = tenum.decode(buf, offset);
          offset += (tenum.decode as any).bytes;
          break;
        case C.DATE_TIME:
          val = tdatetime.decode(buf, offset);
          offset += (tdatetime.decode as any).bytes;
          break;
        case C.TEXT_WITH_LANG:
        case C.NAME_WITH_LANG:
          val = langstr.decode(buf, offset);
          offset += (langstr.decode as any).bytes;
          break;
        default:
          val = str.decode(buf, offset);
          offset += (str.decode as any).bytes;
      }

      if (!name) {
        const attr = group.attributes[group.attributes.length - 1];
        attr.value.push(val);
      } else {
        const attr: Attribute = { tag, name, value: [val] };
        group.attributes.push(attr);
      }

      tag = buf.readInt8(offset++); // delimiter-tag or value-tag
    }

    obj.groups.push(group);
  }

  _decode.bytes = offset - start;

  return obj;
};

_decode.bytes = 0;

// Create decode function alias
const decode = _decode;

// Define encode function with explicit type
const _encode: EncodeFunction = function(obj: IPPBase, buf?: Buffer, offset?: number) {
  if (!buf) buf = Buffer.alloc(encodingLength(obj));
  const oldOffset = offset || 0;
  let pos = oldOffset;

  buf.writeInt8(obj.version ? obj.version.major : 1, pos++);
  buf.writeInt8(obj.version ? obj.version.minor : 1, pos++);

  buf.writeInt16BE('statusCode' in obj ? obj.statusCode : (obj as IPPRequest).operationId, pos);
  pos += 2;

  buf.writeInt32BE(obj.requestId, pos);
  pos += 4;

  if (obj.groups) {
    obj.groups.forEach(function(group) {
      buf.writeInt8(group.tag, pos++);

      group.attributes.forEach(function(attr) {
        const value = Array.isArray(attr.value) ? attr.value : [attr.value];
        value.forEach(function(val, i) {
          buf.writeInt8(attr.tag, pos++);

          str.encode(i ? '' : attr.name, buf, pos);
          pos += (str.encode as any).bytes;

          switch (attr.tag) {
            case C.INTEGER:
              tint.encode(val, buf, pos);
              pos += (tint.encode as any).bytes;
              break;
            case C.BOOLEAN:
              tbool.encode(val, buf, pos);
              pos += (tbool.encode as any).bytes;
              break;
            case C.ENUM:
              tenum.encode(val, buf, pos);
              pos += (tenum.encode as any).bytes;
              break;
            case C.DATE_TIME:
              tdatetime.encode(val, buf, pos);
              pos += (tdatetime.encode as any).bytes;
              break;
            case C.TEXT_WITH_LANG:
            case C.NAME_WITH_LANG:
              langstr.encode(val, buf, pos);
              pos += (langstr.encode as any).bytes;
              break;
            default:
              str.encode(val, buf, pos);
              pos += (str.encode as any).bytes;
          }
        });
      });
    });
  }

  buf.writeInt8(C.END_OF_ATTRIBUTES_TAG, pos++);

  if (obj.data) pos += obj.data.copy(buf, pos);

  _encode.bytes = pos - oldOffset;

  return buf;
};

_encode.bytes = 0;

// Create encode function alias
const encode = _encode;

function encodingLength(obj: IPPBase): number {
  let len = 8; // version-number + status-code + request-id

  if (obj.groups) {
    len += obj.groups.reduce(function (len, group) {
      len += 1; // begin-attribute-group-tag
      len += group.attributes.reduce(function (len, attr) {
        const value = Array.isArray(attr.value) ? attr.value : [attr.value];
        len += value.reduce(function (len, val) {
          len += 1; // value-tag
          len += str.encodingLength(len === 1 ? attr.name : '');

          switch (attr.tag) {
            case C.INTEGER: return len + tint.encodingLength(val);
            case C.BOOLEAN: return len + tbool.encodingLength(val);
            case C.ENUM: return len + tenum.encodingLength(val);
            case C.DATE_TIME: return len + tdatetime.encodingLength(val);
            case C.TEXT_WITH_LANG:
            case C.NAME_WITH_LANG: return len + langstr.encodingLength(val);
            default: return len + str.encodingLength(val);
          }
        }, 0);

        return len;
      }, 0);
      return len;
    }, 0);
  }

  len++; // end-of-attributes-tag

  if (obj.data) len += obj.data.length;

  return len;
}

const tint = {
  decode: function (buf: Buffer, offset: number) {
    const i = buf.readInt32BE(offset + 2);
    (tint.decode as any).bytes = 6;
    return i;
  },
  encode: function (i: number, buf: Buffer, offset: number) {
    buf.writeInt16BE(4, offset);
    buf.writeInt32BE(i, offset + 2);
    (tint.encode as any).bytes = 6;
    return buf;
  },
  encodingLength: function (s: any) {
    return 6;
  }
};

const tenum = {
  decode: function (buf: Buffer, offset: number) {
    const i = buf.readInt32BE(offset + 2);
    (tenum.decode as any).bytes = 6;
    return i;
  },
  encode: function (i: number, buf: Buffer, offset: number) {
    buf.writeInt16BE(4, offset);
    buf.writeInt32BE(i, offset + 2);
    (tenum.encode as any).bytes = 6;
    return buf;
  },
  encodingLength: function (s: any) {
    return 6;
  }
};

const tbool = {
  decode: function (buf: Buffer, offset: number) {
    const b = buf.readInt8(offset + 2) === C.TRUE;
    (tbool.decode as any).bytes = 3;
    return b;
  },
  encode: function (b: boolean, buf: Buffer, offset: number) {
    buf.writeInt16BE(1, offset);
    buf.writeInt8(b ? C.TRUE : C.FALSE, offset + 2);
    (tbool.encode as any).bytes = 3;
    return buf;
  },
  encodingLength: function (s: any) {
    return 3;
  }
};

const langstr = {
  decode: function (buf: Buffer, offset: number) {
    const oldOffset = offset;
    offset += 2;
    const lang = str.decode(buf, offset);
    offset += (str.decode as any).bytes;
    const val = str.decode(buf, offset);
    offset += (str.decode as any).bytes;
    (langstr.decode as any).bytes = offset - oldOffset;
    return { lang, value: val };
  },
  encode: function (obj: LangStrValue, buf: Buffer, offset: number) {
    str.encode(obj.lang, buf, offset + 2);
    let len = (str.encode as any).bytes;
    str.encode(obj.value, buf, offset + 2 + len);
    len += (str.encode as any).bytes;
    buf.writeInt16BE(len, offset);
    (langstr.encode as any).bytes = len + 2;
    return buf;
  },
  encodingLength: function (obj: LangStrValue) {
    return Buffer.byteLength(obj.lang) + Buffer.byteLength(obj.value) + 6;
  }
};

const str = {
  decode: function (buf: Buffer, offset: number) {
    const len = buf.readInt16BE(offset);
    const s = buf.toString('utf-8', offset + 2, offset + 2 + len);
    (str.decode as any).bytes = len + 2;
    return s;
  },
  encode: function (s: string, buf: Buffer, offset: number) {
    const len = buf.write(s, offset + 2);
    buf.writeInt16BE(len, offset);
    (str.encode as any).bytes = len + 2;
    return buf;
  },
  encodingLength: function (s: string) {
    return Buffer.byteLength(s) + 2;
  }
};

const tdatetime = {
  decode: function (buf: Buffer, offset: number) {
    const drift = (buf.readInt8(offset + 11) * 60) + buf.readInt8(offset + 12);
    const sign = buf.slice(offset + 10, offset + 11).toString();
    const actualDrift = sign === '+' ? drift * -1 : drift;

    const d = new Date(Date.UTC(
      buf.readInt16BE(offset + 2),
      buf.readInt8(offset + 4) - 1,
      buf.readInt8(offset + 5),
      buf.readInt8(offset + 6),
      buf.readInt8(offset + 7) + actualDrift,
      buf.readInt8(offset + 8),
      buf.readInt8(offset + 9) * 100
    ));

    (tdatetime.decode as any).bytes = 13;

    return d;
  },
  encode: function (d: Date, buf: Buffer, offset: number) {
    buf.writeInt16BE(11, offset);
    buf.writeInt16BE(d.getFullYear(), offset + 2);
    buf.writeInt8(d.getMonth() + 1, offset + 4);
    buf.writeInt8(d.getDate(), offset + 5);
    buf.writeInt8(d.getHours(), offset + 6);
    buf.writeInt8(d.getMinutes(), offset + 7);
    buf.writeInt8(d.getSeconds(), offset + 8);
    buf.writeInt8(Math.floor(d.getMilliseconds() / 100), offset + 9);
    const offsetVal = d.getTimezoneOffset();
    buf.write(offsetVal > 0 ? '-' : '+', offset + 10);
    buf.writeInt8(Math.abs(offsetVal) / 60, offset + 11);
    buf.writeInt8(Math.abs(offsetVal) % 60, offset + 12);

    (tdatetime.encode as any).bytes = 13;

    return buf;
  },
  encodingLength: function (s: any) {
    return 13;
  }
};

export const request: Encoder<IPPRequest> = {
  decode: function (buf: Buffer, start?: number, end?: number) {
    const obj = decode(buf, start, end);
    (request.decode as any).bytes = decode.bytes;
    const result = {
      ...obj,
      operationId: (obj as any)._oprationIdOrStatusCode
    };
    delete (result as any)._oprationIdOrStatusCode;
    return result as IPPRequest;
  },
  encode,
  encodingLength
};

export const response: Encoder<IPPResponse> = {
  decode: function (buf: Buffer, start?: number, end?: number) {
    const obj = decode(buf, start, end);
    (response.decode as any).bytes = decode.bytes;
    const result = {
      ...obj,
      statusCode: (obj as any)._oprationIdOrStatusCode
    };
    delete (result as any)._oprationIdOrStatusCode;
    return result as IPPResponse;
  },
  encode,
  encodingLength
};
