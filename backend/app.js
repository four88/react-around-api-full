const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const validator = require('validator');
const { celebrate, Joi, errors } = require('celebrate');
const cardRoutes = require('./routes/card');
const usersRoutes = require('./routes/users');
const auth = require('./middleware/auth');
const { NotFoundError } = require('./errors/notFoundError');

const { PORT = 3000 } = process.env;
const { createUser, login } = require('./controllers/users');
const { requestLogger, errorLogger } = require('./middleware/logger');

const app = express();
const allowedCors = [
  'https://around-pharanyu.students.nomoredomainssbs.ru',
  'https://www.around-pharanyu.students.nomoredomainssbs.ru',
  'http://localhost:3000',
  'https://serene-nougat-43ac98.netlify.app',
];
const dbUri = 'mongodb+srv://four88:fourvc88@cluster0.bcbbp8y.mongodb.net/arounddb?retryWrites=true&w=majority';
const dbConfig = {
  useNewUrlParser: true,
};
mongoose.Promise = global.Promise;

// localhost not on my device I change it to 0.0.0.0
mongoose.connect(dbUri, dbConfig).then(
  () => {
    console.log('DB connected');
  },
  (error) => {
    console.log(`cannot connect to DB:${error}`);
  },
);

// const validateURL = (value, helpers) => {
//   if (validator.isURL(value)) {
//     return value;
//   }
//   return helpers.error('string.uri');
// };

app.use(requestLogger);

// for security
app.use(helmet());

// app.use((req, res, next) => {
//   const { origin } = req.headers; // assign the corresponding header to the origin variable
//
//   if (allowedCors.includes(origin)) {
//     // check that the origin value is among the allowed domains
//     res.header('Access-Control-Allow-Origin', origin);
//
//     res.header(
//       'Access-Control-Allow-Methods',
//       'GET, PATCH, PUT, POST, DELETE, OPTIONS',
//     );
//   }
//   next();
// });
//

const corsOptions = {
  origin(origin, callback) {
    if (allowedCors.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors(corsOptions));
app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Server will crash now');
  }, 0);
});

// using routes
app.post(
  '/signup',
  celebrate({
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required(),
    }),
  }),
  createUser,
);
app.post(
  '/signin',
  celebrate({
    body: Joi.object().keys({
      // name: Joi.string().min(2).max(30),
      // about: Joi.string().min(2).max(30),
      // avatar: Joi.string().custom(validateURL),
      email: Joi.string().required().email(),
      password: Joi.string().required(),
    }),
  }),
  login,
);

app.use(auth);

app.use('/users', usersRoutes);
app.use('/cards', cardRoutes);

app.get('*', () => {
  throw new NotFoundError('Requested resource not found');
});

app.use(errorLogger);

app.use(errors());
// for Non-exestent address
app.use((err, req, res, next) => {
  res.status(err.statusCode ? err.statusCode : 500).send({
    message: err.message ? err.message : 'An error occurred on the server',
  });
});

app.listen(PORT, () => {
  console.log(`Conntect to PORT ${PORT}`);
});
