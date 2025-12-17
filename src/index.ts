import { INTEGER, BOOLEAN, ENUM, DATE_TIME, TEXT_WITH_LANG, NAME_WITH_LANG, END_OF_ATTRIBUTES_TAG } from './tags';
import { Buffer } from 'node:buffer';
import { Version, Attribute, AttributeGroup, IPPBase, IPPRequest, IPPResponse, LangStrValue, IPPDecoder, IPPEncoder } from './interfaces';
import { StringCoder, IntCoder, EnumCoder, BoolCoder, LangStringCoder, DateTimeCoder } from './type-coders';
// Export only essential interfaces for IPP encoding/decoding
export type { Version, AttributeValue, Attribute, AttributeGroup, IPPBase, IPPRequest, IPPResponse, LangStrValue, IPPDecoder, IPPEncoder } from './interfaces';


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

  private decodeBase(buf: Buffer, start?: number, end?: number): { version: Version; requestId: number; groups: AttributeGroup[]; operationIdOrStatusCode: number } {
    if (!start) start = 0;
    if (!end) end = buf.length;
    let offset = start;

    const obj = {
      version: { major: 0, minor: 0 },
      groups: [] as AttributeGroup[],
      requestId: 0,
      operationIdOrStatusCode: 0
    };

    obj.version.major = buf.readInt8(offset++);
    obj.version.minor = buf.readInt8(offset++);
    obj.operationIdOrStatusCode = buf.readInt16BE(offset);
    offset += 2;
    obj.requestId = buf.readInt32BE(offset);
    offset += 4;

    // attribute groups
    let tag = buf.readInt8(offset++); // delimiter-tag
    while (tag !== END_OF_ATTRIBUTES_TAG && offset < end) {
      const group: AttributeGroup = { tag, attributes: [] };

      // attribute-with-one-value or additional-value
      tag = buf.readInt8(offset++); // value-tag
      while (tag > 0x0f) {
        const nameResult = this.stringCoder.decode(buf, offset);
        offset += nameResult.bytesConsumed;
        const name = nameResult.value;

        let valueResult: { value: any; bytesConsumed: number };
        switch (tag) {
          case INTEGER:
            valueResult = this.intCoder.decode(buf, offset);
            break;
          case BOOLEAN:
            valueResult = this.boolCoder.decode(buf, offset);
            break;
          case ENUM:
            valueResult = this.enumCoder.decode(buf, offset);
            break;
          case DATE_TIME:
            valueResult = this.dateTimeCoder.decode(buf, offset);
            break;
          case TEXT_WITH_LANG:
          case NAME_WITH_LANG:
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
    return {
      version: obj.version,
      requestId: obj.requestId,
      groups: obj.groups,
      operationId: obj.operationIdOrStatusCode
    };
  }

  decodeResponse(buf: Buffer, start?: number, end?: number): IPPResponse {
    const obj = this.decodeBase(buf, start, end);
    return {
      version: obj.version,
      requestId: obj.requestId,
      groups: obj.groups,
      statusCode: obj.operationIdOrStatusCode
    };
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
              case INTEGER:
                encodeResult = this.intCoder.encode(val as number, buf, pos);
                break;
              case BOOLEAN:
                encodeResult = this.boolCoder.encode(val as boolean, buf, pos);
                break;
              case ENUM:
                encodeResult = this.enumCoder.encode(val as number, buf, pos);
                break;
              case DATE_TIME:
                encodeResult = this.dateTimeCoder.encode(val as Date, buf, pos);
                break;
              case TEXT_WITH_LANG:
              case NAME_WITH_LANG:
                encodeResult = this.langStringCoder.encode(val as LangStrValue, buf, pos);
                break;
              default:
                encodeResult = this.stringCoder.encode(val as string, buf, pos);
            }
            pos += encodeResult.bytesWritten;
          });
        });
      });
    }

    buf.writeInt8(END_OF_ATTRIBUTES_TAG, pos++);

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
          len += value.reduce((acc: number, val, i) => {
            let newLen = acc;
            newLen += 1; // value-tag
            newLen += this.stringCoder.encodingLength(i === 0 ? attr.name : '');

            switch (attr.tag) {
              case INTEGER: return newLen + this.intCoder.encodingLength(val as number);
              case BOOLEAN: return newLen + this.boolCoder.encodingLength(val as boolean);
              case ENUM: return newLen + this.enumCoder.encodingLength(val as number);
              case DATE_TIME: return newLen + this.dateTimeCoder.encodingLength(val as Date);
              case TEXT_WITH_LANG:
              case NAME_WITH_LANG: return newLen + this.langStringCoder.encodingLength(val as LangStrValue);
              default: return newLen + this.stringCoder.encodingLength(val as string);
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
