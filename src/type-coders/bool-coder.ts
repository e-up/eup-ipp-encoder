import { Buffer } from 'node:buffer';
import * as C from '../constants';
import { TypeCoder } from '../interfaces';

// Boolean Type Coder
export class BoolCoder implements TypeCoder<boolean> {
  decode(buf: Buffer, offset: number): { value: boolean; bytesConsumed: number } {
    const value = buf.readInt8(offset + 2) === C.TRUE;
    return { value, bytesConsumed: 3 };
  }

  encode(value: boolean, buf: Buffer, offset: number): { bytesWritten: number } {
    buf.writeInt16BE(1, offset);
    buf.writeInt8(value ? C.TRUE : C.FALSE, offset + 2);
    return { bytesWritten: 3 };
  }

  encodingLength(value: boolean): number {
    return 3;
  }
}