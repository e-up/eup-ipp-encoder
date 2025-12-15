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

export interface LangStrValue {
  lang: string;
  value: string;
}

// Base interfaces for type encoders/decoders
export interface TypeDecoder<T = any> {
  decode(buf: Buffer, offset: number): { value: T; bytesConsumed: number };
}

export interface TypeEncoder<T = any> {
  encode(value: T, buf: Buffer, offset: number): { bytesWritten: number };
  encodingLength(value: T): number;
}

export interface TypeCoder<T = any> extends TypeDecoder<T>, TypeEncoder<T> {}

// IPP Coder interfaces
export interface IPPDecoder {
  decodeRequest(buf: Buffer, start?: number, end?: number): IPPRequest;
  decodeResponse(buf: Buffer, start?: number, end?: number): IPPResponse;
}

export interface IPPEncoder {
  encode(obj: IPPBase, buf?: Buffer, offset?: number): Buffer;
  encodingLength(obj: IPPBase): number;
}
