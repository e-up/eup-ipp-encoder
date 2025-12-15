export interface StatusCodes {
  [key: number]: string;
}

// Successful Status Codes
export const SUCCESSFUL_OK = 0x0000
export const SUCCESSFUL_OK_IGNORED_OR_SUBSTITUTED_ATTRIBUTES = 0x0001
export const SUCCESSFUL_OK_CONFLICTING_ATTRIBUTES = 0x0002

// Client Error Status Codes
export const CLIENT_ERROR_BAD_REQUEST = 0x0400
export const CLIENT_ERROR_FORBIDDEN = 0x0401
export const CLIENT_ERROR_NOT_AUTHENTICATED = 0x0402
export const CLIENT_ERROR_NOT_AUTHORIZED = 0x0403
export const CLIENT_ERROR_NOT_POSSIBLE = 0x0404
export const CLIENT_ERROR_TIMEOUT = 0x0405
export const CLIENT_ERROR_NOT_FOUND = 0x0406
export const CLIENT_ERROR_GONE = 0x0407
export const CLIENT_ERROR_REQUEST_ENTITY_TOO_LARGE = 0x0408
export const CLIENT_ERROR_REQUEST_VALUE_TOO_LONG = 0x0409
export const CLIENT_ERROR_DOCUMENT_FORMAT_NOT_SUPPORTED = 0x040a
export const CLIENT_ERROR_ATTRIBUTES_OR_VALUES_NOT_SUPPORTED = 0x040b
export const CLIENT_ERROR_URI_SCHEME_NOT_SUPPORTED = 0x040c
export const CLIENT_ERROR_CHARSET_NOT_SUPPORTED = 0x040d
export const CLIENT_ERROR_CONFLICTING_ATTRIBUTES = 0x040e
export const CLIENT_ERROR_COMPRESSION_NOT_SUPPORTED = 0x040f
export const CLIENT_ERROR_COMPRESSION_ERROR = 0x0410
export const CLIENT_ERROR_DOCUMENT_FORMAT_ERROR = 0x0411
export const CLIENT_ERROR_DOCUMENT_ACCESS_ERROR = 0x0412

// Server Error Status Codes
export const SERVER_ERROR_INTERNAL_ERROR = 0x0500
export const SERVER_ERROR_OPERATION_NOT_SUPPORTED = 0x0501
export const SERVER_ERROR_SERVICE_UNAVAILABLE = 0x0502
export const SERVER_ERROR_VERSION_NOT_SUPPORTED = 0x0503
export const SERVER_ERROR_DEVICE_ERROR = 0x0504
export const SERVER_ERROR_TEMPORARY_ERROR = 0x0505
export const SERVER_ERROR_NOT_ACCEPTING_JOBS = 0x0506
export const SERVER_ERROR_BUSY = 0x0507
export const SERVER_ERROR_JOB_CANCELED = 0x0508
export const SERVER_ERROR_MULTIPLE_DOCUMENT_JOBS_NOT_SUPPORTED = 0x0509

export const statusCodes: StatusCodes = {
  // Successful Status Codes
  0x0000: 'successful-ok',
  0x0001: 'successful-ok-ignored-or-substituted-attributes',
  0x0002: 'successful-ok-conflicting-attributes',

  // Client Error Status Codes
  0x0400: 'client-error-bad-request',
  0x0401: 'client-error-forbidden',
  0x0402: 'client-error-not-authenticated',
  0x0403: 'client-error-not-authorized',
  0x0404: 'client-error-not-possible',
  0x0405: 'client-error-timeout',
  0x0406: 'client-error-not-found',
  0x0407: 'client-error-gone',
  0x0408: 'client-error-request-entity-too-large',
  0x0409: 'client-error-request-value-too-long',
  0x040a: 'client-error-document-format-not-supported',
  0x040b: 'client-error-attributes-or-values-not-supported',
  0x040c: 'client-error-uri-scheme-not-supported',
  0x040d: 'client-error-charset-not-supported',
  0x040e: 'client-error-conflicting-attributes',
  0x040f: 'client-error-compression-not-supported',
  0x0410: 'client-error-compression-error',
  0x0411: 'client-error-document-format-error',
  0x0412: 'client-error-document-access-error',

  // Server Error Status Codes
  0x0500: 'server-error-internal-error',
  0x0501: 'server-error-operation-not-supported',
  0x0502: 'server-error-service-unavailable',
  0x0503: 'server-error-version-not-supported',
  0x0504: 'server-error-device-error',
  0x0505: 'server-error-temporary-error',
  0x0506: 'server-error-not-accepting-jobs',
  0x0507: 'server-error-busy',
  0x0508: 'server-error-job-canceled',
  0x0509: 'server-error-multiple-document-jobs-not-supported'
}
