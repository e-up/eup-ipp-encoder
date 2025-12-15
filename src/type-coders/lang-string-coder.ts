import { Buffer } from 'node:buffer';
import { TypeCoder, LangStrValue } from '../interfaces';
import { StringCoder } from './string-coder';

// Language String Type Coder
export class LangStringCoder implements TypeCoder<LangStrValue> {
  private stringCoder: StringCoder;

  constructor() {
    this.stringCoder = new StringCoder();
  }

  decode(buf: Buffer, offset: number): { value: LangStrValue; bytesConsumed: number } {
    const oldOffset = offset;
    offset += 2; // Skip length header
    
    const langResult = this.stringCoder.decode(buf, offset);
    offset += langResult.bytesConsumed;
    
    const valueResult = this.stringCoder.decode(buf, offset);
    offset += valueResult.bytesConsumed;
    
    return {
      value: { lang: langResult.value, value: valueResult.value },
      bytesConsumed: offset - oldOffset
    };
  }

  encode(value: LangStrValue, buf: Buffer, offset: number): { bytesWritten: number } {
    const langResult = this.stringCoder.encode(value.lang, buf, offset + 2);
    const valueResult = this.stringCoder.encode(value.value, buf, offset + 2 + langResult.bytesWritten);
    
    const totalLength = langResult.bytesWritten + valueResult.bytesWritten;
    buf.writeInt16BE(totalLength, offset);
    
    return { bytesWritten: totalLength + 2 };
  }

  encodingLength(value: LangStrValue): number {
    return Buffer.byteLength(value.lang) + Buffer.byteLength(value.value) + 6;
  }
}