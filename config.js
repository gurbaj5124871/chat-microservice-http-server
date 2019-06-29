'use strict';

const Confidence        = require('confidence');

const criteria          = {
    env : process.env.NODE_ENV
}

const config            = {
    microServiceName    : 'joker',

    port                : {
        $filter         : 'env',
        dev             : 3002,
        test            : 3002,
        prod            : process.env.PORT || 3003,
        $default        : 3002
    },

    jwt                 : {
        secret          : {
            $filter     : 'env',
            dev         : "development_secret",
            test        : "development_secret",
            prod        : "development_secret",
            $default    : "development_secret"
        },
        expireAfter     : {
            admin       : {
                web     : '1d'
            },
            serviceProvider: {
                android : '30d',
                ios     : '30d',
                web     : '7d',
                mobileWeb: '1d'
            },
            customer    : {
                android : '30d',
                ios     : '30d',
                web     : '1d',
                mobileWeb: '1d'
            }
        }
    },

    winston             : {
        $filter         : 'env',
        dev             : 'debug',
        test            : 'debug',
        prod            : 'info'
    },

    cassandra           : {
        $filter         : 'env',
        dev             : {keyspace: 'dhandahub_chat', contactPoints: ['localhost'], localDataCenter: 'datacenter1'},
        test            : {keyspace: 'dhandahub_chat', contactPoints: ['localhost'], localDataCenter: 'datacenter1'},
        prod            : {
                            keyspace: 'dhandahub_chat', user: 'chat', password: 'tTyGQTMqTFkkQeA',
                            contactPoints: ["batman1.dhandahub.com", "batman2.dhandahub.com"], localDataCenter: 'ap-south'
                            
        },
        $default        : {keyspace: 'dhandahub_chat', contactPoints: ['localhost'], localDataCenter: 'datacenter1'}
    },

    mongodb             : {
        $filter         : 'env',
        dev             : {url: `mongodb://localhost:27017`, db: 'dhandahub'},
        test            : {url: `mongodb://localhost:27017`, db: 'dhandahub'},
        prod            : {url: `mongodb://localhost:27017`, db: 'dhandahub'},
        $default        : {url: `mongodb://localhost:27017`, db: 'dhandahub'},
    },

    redis: {
        $filter         : 'env',
        dev             : 'redis://127.0.0.1:6379',
        test            : 'redis://localhost:6379',
        prod            : 'redis://127.0.0.1:6379',
        $default        : 'redis://localhost:6379'
    },

    morgan              : {
        $filter         : 'env',
        dev             : 'dev',
        test            : ':method :url :status :response-time ms - :req[x-real-ip] [:date[iso]]',
        prod            : ':method :url HTTP/:http-version :status :req[x-real-ip] [:date[iso]] \":remote-addr - :remote-user\" \":referrer\" \":user-agent\" - :response-time ms',
        $default        : 'dev'
    },

    mqttBroker          : {
        url             : {
            $filter     : 'env',
            dev         : 'ws://localhost:8883',
            test        : 'ws://localhost:8883',
            prod        : 'ws://localhost:8883',
            $default    : 'ws://localhost:8883',
        },
        clientId        : 'joker',
        username        : 'joker',
        password        : 'password'
    }
}

// Caching server configs and constants
const store             = new Confidence.Store(config)
const get               = key => store.get(key, criteria)
const meta              = key => store.meta(key, criteria)

module.exports          = { get, meta }