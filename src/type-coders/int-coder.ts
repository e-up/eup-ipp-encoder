import { Buffer } from 'node:buffer';
import { TypeCoder } from '../interfaces';

// Integer Type Coder
export class IntCoder implements TypeCoder<number> {
  decode(buf: Buffer, offset: number): { value: number; bytesConsumed: number } {
    const value = buf.readInt32BE(offset + 2);
    return { value, bytesConsumed: 6 };
  }

  encode(value: number, buf: Buffer, offset: number): { bytesWritten: number } {
    buf.writeInt16BE(4, offset);
    buf.writeInt32BE(value, offset + 2);
    return { bytesWritten: 6 };
  }

  encodingLength(value: number): number {
    return 6;
  }
}

// Enum Type Coder (same implementation as IntCoder)
export class EnumCoder extends IntCoder {
  // Reuse IntCoder implementation since Enum is stored as Int
}