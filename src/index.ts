import express, { Application, Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import { ApiError, BadRequestError, NotFoundError } from './utils/ApiError';
import { asyncWrapper } from './utils/asyncWrapper';
import { StatusCodes } from 'http-status-codes';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserRequest } from './requests/CreateUserRequest';
import RequestValidator from './utils/RequestValidator';
import ErrorHandler from './utils/ErrorHandler';

const app: Application = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get(
  '/protected',
  asyncWrapper(async (req: Request, res: Response) => {
    await customFunction();
  }),
);

const customFunction = async () => {
  throw new ApiError(StatusCodes.BAD_REQUEST, 'This is just a bad request!');
};

app.post('/create-user', RequestValidator.validate(CreateUserRequest), async (req: Request, res: Response) => {
  res.status(200).send({
    message: 'Hello World from post!',
  });
});

app.use((req: Request, res: Response, next: NextFunction) => next(new NotFoundError(req.path)));

app.use(ErrorHandler.handle());

try {
  app.listen(PORT, (): void => {
    console.log(`Connected successfully on port ${PORT}`);
  });
} catch (error: any) {
  console.error(`Error occured: ${error.message}`);
}

process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
  console.log(reason.name, reason.message);
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  process.exit(1);
  throw reason;
});

process.on('uncaughtException', (err: Error) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');

  process.exit(1);
});
