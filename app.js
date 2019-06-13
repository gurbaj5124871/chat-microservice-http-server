const   express                 = require('express'),
        bodyParser              = require('body-parser'),
        morgan                  = require('morgan'),
        errify                  = require('./src/utils/errify'),
        logger                  = require('./src/utils/logger'),
        path                    = require('path'),
        helmet                  = require('helmet'),
        nodeStats               = require('./src/utils/node-stats');
        favicon                 = require('serve-favicon'),
        config                  = require('./app-config');

const   app                     = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(helmet());
app.use(morgan(config.get('/morgan'), {skip: (req, res) => res.statusCode < 400, stream: process.stderr}));
app.use(morgan(config.get('/morgan'), {skip: (req, res) => res.statusCode >= 400, stream: process.stdout}));
//if(process.env.NODE_ENV !== 'prod')
//app.use(express.static(path.join(__dirname, './swagger/dist')))
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE, PURGE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');
    next();
});
app.use(function (req, res, next) {
    if (req.app.get('env') !== 'prod' && ['POST', 'PATCH', 'PUT'].includes(req.method))
        logger.verbose('Body', JSON.stringify(req.body));
    next();
});

if(process.env.NODE_ENV === 'prod') {
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('/', (req, res) => res.render('index', {title: 'Joker'}))
}
app.get('/moniter', nodeStats)

// Registering Modules / Routes
require('./src/modules')(app)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = errify.notFound('Hmm... Its embarrassing. This should not happen.', '1054');
    delete err.stack;
    next(err);
});
app.use(errify.errorhandlerMiddleware);

// Bootstraping
(async () => {
    await require('./bootstrap/mongo').connectMongo()
    await require('./bootstrap/redis')
    await new Promise((res, rej) => {require('./bootstrap/cassandra').connect(async err => {if (err) {rej(err)} else {res()}})})
    //await require('./src/mqtt')
    await require('./src/ms-inter-comm')
})();

process.on('uncaughtException', err => {
    logger.error({message: err.message, name: err.name, stack: err.stack});
    // logger.error('\n-----------------------EXITING PROCESS-----------------------\n');
    // process.exit(1);
});

process.on('unhandledRejection', err => {
    logger.error({message: err.message, name: err.name, stack: err.stack});
    logger.error('\n-----------------------EXITING PROCESS-----------------------\n');
    process.exit(1);
});

module.exports = app;