const logger                = require('./logger'),
    errMsg                  = require('./error-messages'),
    {isCelebrate}           = require('celebrate');

const errorhandlerMiddleware= (err, req, res, next) => {
    logger.error(err)
    if(isCelebrate(err)) {
        err = createError(err.name, err.details[0] ? err.details[0].message : errMsg[1001], 500, '1001')
        delete err.isErrifyied
    } else if(err.isErrifyied === true)
    delete err.isErrifyied
    else {
        err = createError(err, err.name, err.statusCode, err.errCode)
        delete err.isErrifyied
    }
    res.status(err.statusCode || 500).send({error: err})
}

const createError       = (error, msg, statusCode, errCode) => {
    const err = {
        error: error || 'Internal Server Error',
        message: msg || 'An internal server error occured',
        statusCode: isNaN(parseInt(statusCode)) || statusCode < 400 ? 500 : statusCode,
        errCode,
        isErrifyied: true
    }
    return err
}

// 400 series error obj
const badRequest            = (msg, errCode) => createError(errMessHashMap["400"], msg, 400, errCode)
const unauthorized          = (msg, errCode) => createError(errMessHashMap["401"], msg, 401, errCode)
const paymentRequired       = (msg, errCode) => createError(errMessHashMap["402"], msg, 402, errCode)
const forbidden             = (msg, errCode) => createError(errMessHashMap["403"], msg, 403, errCode)
const notFound              = (msg, errCode) => createError(errMessHashMap["404"], msg, 404, errCode)
const methodNotAllowed      = (msg, errCode) => createError(errMessHashMap["405"] ,msg, 405, errCode)
const notAcceptable         = (msg, errCode) => createError(errMessHashMap["406"], msg, 406, errCode)
const proxyAuthRequired     = (msg, errCode) => createError(errMessHashMap["407"], msg, 407, errCode)
const clientTimeout         = (msg, errCode) => createError(errMessHashMap["408"], msg, 408, errCode)
const conflict              = (msg, errCode) => createError(errMessHashMap["409"], msg, 409, errCode)
const resourceGone          = (msg, errCode) => createError(errMessHashMap["410"], msg, 410, errCode)
const lengthRequired        = (msg, errCode) => createError(errMessHashMap["411"], msg, 411, errCode)
const preconditionFailed    = (msg, errCode) => createError(errMessHashMap["412"], msg, 412, errCode)
const entityTooLarge        = (msg, errCode) => createError(errMessHashMap["413"], msg, 413, errCode)
const uriTooLong            = (msg, errCode) => createError(errMessHashMap["414"], msg, 414, errCode)
const unsupportedMediaType  = (msg, errCode) => createError(errMessHashMap["415"], msg, 415, errCode)
const rangeNotSatisfiable   = (msg, errCode) => createError(errMessHashMap["416"], msg, 416, errCode)
const expectationFailed     = (msg, errCode) => createError(errMessHashMap["417"], msg, 417, errCode)
const teapot                = (msg, errCode) => createError(errMessHashMap["418"], msg, 418, errCode)
const badData               = (msg, errCode) => createError(errMessHashMap["422"], msg, 422, errCode)
const locked                = (msg, errCode) => createError(errMessHashMap["423"], msg, 423, errCode)
const failedDependency      = (msg, errCode) => createError(errMessHashMap["424"], msg, 424, errCode)
const preconditionRequired  = (msg, errCode) => createError(errMessHashMap["428"], msg, 428, errCode)
const tooManyRequests       = (msg, errCode) => createError(errMessHashMap["429"], msg, 429, errCode)
const illegal               = (msg, errCode) => createError(errMessHashMap["451"], msg, 451, errCode)

// 500 series error obj
const badImplementation     = (msg, errCode) => createError(errMessHashMap["500"], msg, 500, errCode)
const notImplemented        = (msg, errCode) => createError(errMessHashMap["501"], msg, 501, errCode)
const badGateway            = (msg, errCode) => createError(errMessHashMap["502"], msg, 502, errCode)
const serverUnavailable     = (msg, errCode) => createError(errMessHashMap["503"], msg, 503, errCode)
const gatewayTimeout        = (msg, errCode) => createError(errMessHashMap["504"], msg, 504, errCode)

module.exports = {
    errorhandlerMiddleware,
    createError,
    badRequest,
    unauthorized,
    paymentRequired,
    forbidden,
    notFound,
    methodNotAllowed,
    notAcceptable,
    proxyAuthRequired,
    clientTimeout,
    conflict,
    resourceGone,
    lengthRequired,
    preconditionFailed,
    entityTooLarge,
    uriTooLong,
    unsupportedMediaType,
    rangeNotSatisfiable,
    expectationFailed,
    teapot,
    badData,
    locked,
    failedDependency,
    preconditionRequired,
    tooManyRequests,
    illegal,
    badImplementation,
    notImplemented,
    badGateway,
    serverUnavailable,
    gatewayTimeout
}

// Errors from status codes
const errMessHashMap = Object.freeze({
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Auth Required',
    408: 'Client Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Entity Too Large',
    414: 'Request-URI Too Large',
    415: 'Unsupported Media Type',
    416: 'Requested Range Not Satisfiable',
    417: 'Expectation Failed',
    418: 'I\'m a Teapot',

    422: 'Unprocessable Entity',
    423: 'Locked',
    424: 'Failed Dependency',

    428: 'Precondition Required',
    429: 'Too Many Requests',
    451: 'Unavailable For Legal Reasons',

    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Time-out'
})