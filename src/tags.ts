'use strict'

export const FALSE = 0x00
export const TRUE = 0x01

// Delimiter Tags
export const OPERATION_ATTRIBUTES_TAG = 0x01
export const JOB_ATTRIBUTES_TAG = 0x02
export const END_OF_ATTRIBUTES_TAG = 0x03
export const PRINTER_ATTRIBUTES_TAG = 0x04
export const UNSUPPORTED_ATTRIBUTES_TAG = 0x05

// Value Tags (out-of-band)
export const UNSUPPORTED = 0x10
export const UNKNOWN = 0x12
export const NO_VALUE = 0x13

// Value Tags (integer)
export const INTEGER = 0x21
export const BOOLEAN = 0x22
export const ENUM = 0x23

// Value Tags (octet-string)
export const OCTET_STRING = 0x30 // with unspecified format
export const DATE_TIME = 0x31
export const RESOLUTION = 0x32
export const RANGE_OF_INTEGER = 0x33
export const TEXT_WITH_LANG = 0x35
export const NAME_WITH_LANG = 0x36

// Value Tags (character-string)
export const TEXT_WITHOUT_LANG = 0x41
export const NAME_WITHOUT_LANG = 0x42
export const KEYWORD = 0x44
export const URI = 0x45
export const URI_SCHEME = 0x46
export const CHARSET = 0x47
export const NATURAL_LANG = 0x48
export const MIME_MEDIA_TYPE = 0x49
