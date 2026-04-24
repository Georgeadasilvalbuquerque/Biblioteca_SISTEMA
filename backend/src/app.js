const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const router = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/erroHandller');

function createApp() {
    const app = express();

    app.disable('x-powered-by');
    app.use(helmet());
    app.use(cors());
    app.use(express.json({ limit: '1mb'}));
    app.use(express.urlencoded({ extended: true }));

    if (process.env.NODE_ENV !== 'test') {
        app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
    }

    app.use('/api', router);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

module.exports = createApp;