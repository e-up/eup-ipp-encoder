import { Buffer } from 'node:buffer';
import { TypeCoder } from '../interfaces';

// Date Time Type Coder
export class DateTimeCoder implements TypeCoder<Date> {
  decode(buf: Buffer, offset: number): { value: Date; bytesConsumed: number } {
    const year = buf.readInt16BE(offset + 2);
    const month = buf.readInt8(offset + 4) - 1; // Convert to JS 0-based month
    const day = buf.readInt8(offset + 5);
    const hour = buf.readInt8(offset + 6);
    const minute = buf.readInt8(offset + 7);
    const second = buf.readInt8(offset + 8);
    const deciSecond = buf.readInt8(offset + 9);

    // IPP date-time field is in local time format, so create date in local time
    // We ignore the timezone offset since JavaScript Date handles timezone internally
    const date = new Date(year, month, day, hour, minute, second, deciSecond * 100);

    return { value: date, bytesConsumed: 13 };
  }

  encode(value: Date, buf: Buffer, offset: number): { bytesWritten: number } {
    buf.writeInt16BE(11, offset); // Length
    buf.writeInt16BE(value.getFullYear(), offset + 2);
    buf.writeInt8(value.getMonth() + 1, offset + 4); // Convert to 1-based month
    buf.writeInt8(value.getDate(), offset + 5);
    buf.writeInt8(value.getHours(), offset + 6);
    buf.writeInt8(value.getMinutes(), offset + 7);
    buf.writeInt8(value.getSeconds(), offset + 8);
    buf.writeInt8(Math.floor(value.getMilliseconds() / 100), offset + 9);
    buf.write(value.getTimezoneOffset() > 0 ? '-' : '+', offset + 10);
    buf.writeInt8(Math.abs(value.getTimezoneOffset()) / 60, offset + 11);
    buf.writeInt8(Math.abs(value.getTimezoneOffset()) % 60, offset + 12);

    return { bytesWritten: 13 };
  }

  encodingLength(value: Date): number {
    return 13;
  }
}