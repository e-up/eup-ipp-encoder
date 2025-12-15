import * as C from './constants';
import { statusCodes } from './status-codes';
import { Buffer } from 'node:buffer';
import { Version, Attribute, AttributeGroup, IPPBase, IPPRequest, IPPResponse, LangStrValue, IPPDecoder, IPPEncoder } from './interfaces';
import { StringCoder, IntCoder, EnumCoder, BoolCoder, LangStringCoder, DateTimeCoder } from './type-coders';

export const CONSTANTS = C;
export { statusCodes as STATUS_CODES };
// Re-export interfaces for backwards compatibility
export type { Version, Attribute, AttributeGroup, IPPBase, IPPRequest, IPPResponse, LangStrValue, IPPDecoder, IPPEncoder } from './interfaces';
// Re-export type coders for potential use by consumers
export { StringCoder, IntCoder, EnumCoder, BoolCoder, LangStringCoder, DateTimeCoder } from './type-coders';


// IPP Decoder Implementation
export class IPPDecoderImpl implements IPPDecoder {
  private stringCoder: StringCoder;
  private intCoder: IntCoder;
  private enumCoder: EnumCoder;
  private boolCoder: BoolCoder;
  private langStringCoder: LangStringCoder;
  private dateTimeCoder: DateTimeCoder;

  constructor() {
    this.stringCoder = new StringCoder();
    this.intCoder = new IntCoder();
    this.enumCoder = new EnumCoder();
    this.boolCoder = new BoolCoder();
    this.langStringCoder = new LangStringCoder();
    this.dateTimeCoder = new DateTimeCoder();
  }

  private decodeBase(buf: Buffer, start?: number, end?: number): IPPBase & { _oprationIdOrStatusCode: number } {
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
        const nameResult = this.stringCoder.decode(buf, offset);
        offset += nameResult.bytesConsumed;
        const name = nameResult.value;

        let valueResult: { value: any; bytesConsumed: number };
        switch (tag) {
          case C.INTEGER:
            valueResult = this.intCoder.decode(buf, offset);
            break;
          case C.BOOLEAN:
            valueResult = this.boolCoder.decode(buf, offset);
            break;
          case C.ENUM:
            valueResult = this.enumCoder.decode(buf, offset);
            break;
          case C.DATE_TIME:
            valueResult = this.dateTimeCoder.decode(buf, offset);
            break;
          case C.TEXT_WITH_LANG:
          case C.NAME_WITH_LANG:
            valueResult = this.langStringCoder.decode(buf, offset);
            break;
          default:
            valueResult = this.stringCoder.decode(buf, offset);
        }
        offset += valueResult.bytesConsumed;

        if (!name) {
          const attr = group.attributes[group.attributes.length - 1];
          attr.value.push(valueResult.value);
        } else {
          const attr: Attribute = { tag, name, value: [valueResult.value] };
          group.attributes.push(attr);
        }

        tag = buf.readInt8(offset++); // delimiter-tag or value-tag
      }

      obj.groups.push(group);
    }

    return obj;
  }

  decodeRequest(buf: Buffer, start?: number, end?: number): IPPRequest {
    const obj = this.decodeBase(buf, start, end);
    const result = {
      ...obj,
      operationId: obj._oprationIdOrStatusCode
    };
    delete (result as any)._oprationIdOrStatusCode;
    return result as IPPRequest;
  }

  decodeResponse(buf: Buffer, start?: number, end?: number): IPPResponse {
    const obj = this.decodeBase(buf, start, end);
    const result = {
      ...obj,
      statusCode: obj._oprationIdOrStatusCode
    };
    delete (result as any)._oprationIdOrStatusCode;
    return result as IPPResponse;
  }
}

// IPP Encoder Implementation
export class IPPEncoderImpl implements IPPEncoder {
  private stringCoder: StringCoder;
  private intCoder: IntCoder;
  private enumCoder: EnumCoder;
  private boolCoder: BoolCoder;
  private langStringCoder: LangStringCoder;
  private dateTimeCoder: DateTimeCoder;

  constructor() {
    this.stringCoder = new StringCoder();
    this.intCoder = new IntCoder();
    this.enumCoder = new EnumCoder();
    this.boolCoder = new BoolCoder();
    this.langStringCoder = new LangStringCoder();
    this.dateTimeCoder = new DateTimeCoder();
  }

  encode(obj: IPPBase, buf?: Buffer, offset?: number): Buffer {
    if (!buf) buf = Buffer.alloc(this.encodingLength(obj));
    const oldOffset = offset || 0;
    let pos = oldOffset;

    buf.writeInt8(obj.version ? obj.version.major : 1, pos++);
    buf.writeInt8(obj.version ? obj.version.minor : 1, pos++);

    buf.writeInt16BE('statusCode' in obj ? obj.statusCode : (obj as IPPRequest).operationId, pos);
    pos += 2;

    buf.writeInt32BE(obj.requestId, pos);
    pos += 4;

    if (obj.groups) {
      obj.groups.forEach((group) => {
        buf.writeInt8(group.tag, pos++);

        group.attributes.forEach((attr) => {
          const value = Array.isArray(attr.value) ? attr.value : [attr.value];
          value.forEach((val, i) => {
            buf.writeInt8(attr.tag, pos++);

            const nameResult = this.stringCoder.encode(i ? '' : attr.name, buf, pos);
            pos += nameResult.bytesWritten;

            let encodeResult: { bytesWritten: number };
            switch (attr.tag) {
              case C.INTEGER:
                encodeResult = this.intCoder.encode(val, buf, pos);
                break;
              case C.BOOLEAN:
                encodeResult = this.boolCoder.encode(val, buf, pos);
                break;
              case C.ENUM:
                encodeResult = this.enumCoder.encode(val, buf, pos);
                break;
              case C.DATE_TIME:
                encodeResult = this.dateTimeCoder.encode(val, buf, pos);
                break;
              case C.TEXT_WITH_LANG:
              case C.NAME_WITH_LANG:
                encodeResult = this.langStringCoder.encode(val, buf, pos);
                break;
              default:
                encodeResult = this.stringCoder.encode(val, buf, pos);
            }
            pos += encodeResult.bytesWritten;
          });
        });
      });
    }

    buf.writeInt8(C.END_OF_ATTRIBUTES_TAG, pos++);

    if (obj.data) pos += obj.data.copy(buf, pos);

    return buf;
  }

  encodingLength(obj: IPPBase): number {
    let len = 8; // version-number + status-code + request-id

    if (obj.groups) {
      len += obj.groups.reduce((len, group) => {
        len += 1; // begin-attribute-group-tag
        len += group.attributes.reduce((len, attr) => {
          const value = Array.isArray(attr.value) ? attr.value : [attr.value];
          len += value.reduce((len, val) => {
            len += 1; // value-tag
            len += this.stringCoder.encodingLength(len === 1 ? attr.name : '');

            switch (attr.tag) {
              case C.INTEGER: return len + this.intCoder.encodingLength(val);
              case C.BOOLEAN: return len + this.boolCoder.encodingLength(val);
              case C.ENUM: return len + this.enumCoder.encodingLength(val);
              case C.DATE_TIME: return len + this.dateTimeCoder.encodingLength(val);
              case C.TEXT_WITH_LANG:
              case C.NAME_WITH_LANG: return len + this.langStringCoder.encodingLength(val);
              default: return len + this.stringCoder.encodingLength(val);
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
}

// Main module exports
export const decoder = new IPPDecoderImpl();
export const encoder = new IPPEncoderImpl();

export default {
  decoder,
  encoder
};
