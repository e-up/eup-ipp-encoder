import { Buffer } from 'node:buffer';
import { TypeCoder } from '../interfaces';

// Boolean Type Coder
export class BoolCoder implements TypeCoder<boolean> {
  decode(buf: Buffer, offset: number): { value: boolean; bytesConsumed: number } {
    const value = buf.readInt8(offset + 2) === 0x01;
    return { value, bytesConsumed: 3 };
  }

  encode(value: boolean, buf: Buffer, offset: number): { bytesWritten: number } {
    buf.writeInt16BE(1, offset);
    buf.writeInt8(value ? 0x01 : 0x00, offset + 2);
    return { bytesWritten: 3 };
  }

  encodingLength(value: boolean): number {
    return 3;
  }
}