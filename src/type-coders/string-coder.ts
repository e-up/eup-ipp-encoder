import { Buffer } from 'node:buffer';
import { TypeCoder } from '../interfaces';

// String Type Coder
export class StringCoder implements TypeCoder<string> {
  decode(buf: Buffer, offset: number): { value: string; bytesConsumed: number } {
    const len = buf.readInt16BE(offset);
    const value = buf.toString('utf-8', offset + 2, offset + 2 + len);
    return { value, bytesConsumed: len + 2 };
  }

  encode(value: string, buf: Buffer, offset: number): { bytesWritten: number } {
    const len = buf.write(value, offset + 2);
    buf.writeInt16BE(len, offset);
    return { bytesWritten: len + 2 };
  }

  encodingLength(value: string): number {
    return Buffer.byteLength(value) + 2;
  }
}