# eup-ipp-encoder

互联网打印协议（IPP）编码器和解码器。

该模块为IPP消息提供纯序列化和反序列化实现，仅专注于编码和解码功能。

[![TypeScript](https://img.shields.io/badge/TypeScript-4.0+-blue.svg)](https://www.typescriptlang.org/)

## 安装

```
npm install eup-ipp-encoder
```

## 使用

打印机服务器示例：

```typescript
import * as ipp from 'eup-ipp-encoder'

// 解码来自IPP客户端的二进制缓冲区
const decoded = ipp.decoder.decodeRequest(buf)

// ...处理请求...

// 准备响应
const response: ipp.IPPResponse = {
  statusCode: 0x00, // 如果编码请求，则设置 `operationId` 代替
  requestId: decoded.requestId,
  groups: [
    { tag: 0x01, attributes: [ // OPERATION_ATTRIBUTES_TAG
      { tag: 0x21, name: 'job-id', value: [147] },
      { tag: 0x36, name: 'job-name', value: [{ lang: 'en-us', value: 'Foobar' }] }
    ] }
  ]
}

// 将响应编码为二进制缓冲区
ipp.encoder.encode(response) // <Buffer 01 01 00 00 ... >
```

## API

### `ipp.decoder.decodeRequest(buffer[, start][, end])`

解码IPP请求缓冲区并返回请求对象。

选项：

- `buffer` - 包含请求的缓冲区
- `start` - 可选的开始偏移量，从该位置开始解析请求（默认为 `0`）
- `end` - 可选的结束偏移量，指定解码在哪个字节结束（默认为 `buffer.length`）

请求对象结构：

```typescript
{
  version: {
    major: 1,
    minor: 1
  },
  operationId: 0x02,
  requestId: 1,
  groups: [
    { tag: 0x01, attributes: [ // OPERATION_ATTRIBUTES_TAG
      { tag: 0x21, name: 'job-id', value: [147] },
      { tag: 0x36, name: 'job-name', value: [{ lang: 'en-us', value: 'Foobar' }] },
      { tag: 0x22, name: 'ipp-attribute-fidelity', value: [true] }
    ] }
  ]
}
```

### `ipp.decoder.decodeResponse(buffer[, start][, end])`

与 `ipp.decoder.decodeRequest()` 相同，但用于IPP响应。

### `ipp.encoder.encode(obj[, buffer][, offset])`

编码IPP请求或响应对象并返回编码后的缓冲区。

选项：

- `obj` - 包含请求或响应的对象
- `buffer` - 可选的缓冲区，用于写入编码数据
- `offset` - 可选的偏移量，从该位置开始在缓冲区中写入编码数据（默认为 `0`）

响应对象结构：

```typescript
{
  statusCode: 0x00,
  requestId: 1,
  groups: [
    { tag: 0x01, attributes: [ // OPERATION_ATTRIBUTES_TAG
      { tag: 0x21, name: 'job-id', value: [147] },
      { tag: 0x22, name: 'ipp-attribute-fidelity', value: [true] },
      { tag: 0x36, name: 'job-name', value: [{ lang: 'en-us', value: 'Foobar' }] }
    ] }
  ]
}
```

可以提供与请求中相同格式的自定义IPP版本。默认IPP版本为1.1。

### `ipp.encoder.encodingLength(obj)`

返回编码给定IPP请求或响应对象所需的字节数。

## 支持的标签

该库支持以下IPP标签进行编码和解码：

- **分隔符标签**：
  - OPERATION_ATTRIBUTES_TAG (0x01)
  - JOB_ATTRIBUTES_TAG (0x02)
  - END_OF_ATTRIBUTES_TAG (0x03)

- **值标签**：
  - INTEGER (0x21)
  - BOOLEAN (0x22)
  - ENUM (0x23)
  - DATE_TIME (0x31)
  - TEXT_WITH_LANG (0x35)
  - NAME_WITH_LANG (0x36)
  - KEYWORD (0x44)

## 许可证

MIT
