# eup-ipp-encoder

一个轻量级、专注的互联网打印协议（IPP）编码器和解码器库。

本库致力于提供纯净的IPP消息序列化和反序列化功能，专注于做好编码和解码的核心工作，不包含任何无关的辅助功能。

> 本项目基于 [watson/ipp-encoder](https://github.com/watson/ipp-encoder) 改造优化而来

[![TypeScript](https://img.shields.io/badge/TypeScript-4.0+-blue.svg)](https://www.typescriptlang.org/)

## 安装

```
npm install eup-ipp-encoder
```

## 使用示例

以下是一个简单的打印机服务器场景示例：

```typescript
import * as ipp from 'eup-ipp-encoder'

// 解码来自IPP客户端的二进制请求
const decoded = ipp.decoder.decodeRequest(buf)

// ...在这里处理客户端请求...

// 准备响应数据
const response: ipp.IPPResponse = {
  statusCode: 0x00, // 如果是编码请求，则使用 `operationId` 替代
  requestId: decoded.requestId,
  groups: [
    { 
      tag: 0x01, // OPERATION_ATTRIBUTES_TAG
      attributes: [
        { tag: 0x21, name: 'job-id', value: [147] },
        { tag: 0x36, name: 'job-name', value: [{ lang: 'en-us', value: 'Foobar' }] }
      ] 
    }
  ]
}

// 将响应编码为二进制缓冲区
ipp.encoder.encode(response) // 返回 <Buffer 01 01 00 00 ... >
```

## API 文档

### `ipp.decoder.decodeRequest(buffer[, start][, end])`

将IPP请求的二进制缓冲区解码为结构化的JavaScript对象。

**参数说明：**

- `buffer` - 包含IPP请求数据的二进制缓冲区
- `start` - 可选参数，指定解码的起始偏移位置（默认值：`0`）
- `end` - 可选参数，指定解码的结束偏移位置（默认值：`buffer.length`）

**返回的请求对象结构：**

```typescript
{
  version: {
    major: 1,        // IPP协议主版本号
    minor: 1         // IPP协议次版本号
  },
  operationId: 0x02,  // IPP操作标识符
  requestId: 1,       // 请求ID
  groups: [           // 属性组数组
    { 
      tag: 0x01,      // OPERATION_ATTRIBUTES_TAG
      attributes: [   // 属性列表
        { tag: 0x21, name: 'job-id', value: [147] },
        { tag: 0x36, name: 'job-name', value: [{ lang: 'en-us', value: 'Foobar' }] },
        { tag: 0x22, name: 'ipp-attribute-fidelity', value: [true] }
      ] 
    }
  ]
}
```

### `ipp.decoder.decodeResponse(buffer[, start][, end])`

与 `decodeRequest()` 方法用法完全相同，但专门用于解码IPP响应消息。

### `ipp.encoder.encode(obj[, buffer][, offset])`

将结构化的IPP请求或响应对象编码为二进制缓冲区。

**参数说明：**

- `obj` - 要编码的IPP请求或响应对象
- `buffer` - 可选参数，用于存储编码后数据的目标缓冲区
- `offset` - 可选参数，指定在目标缓冲区中的写入起始位置（默认值：`0`）

**响应对象示例结构：**

```typescript
{
  statusCode: 0x00,   // 响应状态码（请求使用operationId）
  requestId: 1,       // 请求ID（与对应的请求保持一致）
  groups: [           // 属性组数组
    { 
      tag: 0x01,      // OPERATION_ATTRIBUTES_TAG
      attributes: [   // 属性列表
        { tag: 0x21, name: 'job-id', value: [147] },
        { tag: 0x22, name: 'ipp-attribute-fidelity', value: [true] },
        { tag: 0x36, name: 'job-name', value: [{ lang: 'en-us', value: 'Foobar' }] }
      ] 
    }
  ]
}
```

> 提示：可以在请求或响应对象中指定自定义IPP版本（格式与上述示例中的version字段相同），默认使用IPP 1.1版本。

### `ipp.encoder.encodingLength(obj)`

计算编码指定IPP请求或响应对象所需的字节数，用于预先分配合适大小的缓冲区。

## 支持的IPP标签

本库支持以下IPP标签的编码和解码功能：

### 分隔符标签

分隔符标签用于组织属性组：

- `OPERATION_ATTRIBUTES_TAG` (0x01) - 操作属性组标签
- `JOB_ATTRIBUTES_TAG` (0x02) - 作业属性组标签
- `END_OF_ATTRIBUTES_TAG` (0x03) - 属性组结束标签

### 值类型标签

值类型标签用于标识属性值的数据类型：

- `INTEGER` (0x21) - 整数类型
- `BOOLEAN` (0x22) - 布尔类型
- `ENUM` (0x23) - 枚举类型
- `DATE_TIME` (0x31) - 日期时间类型
- `TEXT_WITH_LANG` (0x35) - 带语言信息的文本
- `NAME_WITH_LANG` (0x36) - 带语言信息的名称
- `KEYWORD` (0x44) - 关键字类型

## 许可证

MIT
