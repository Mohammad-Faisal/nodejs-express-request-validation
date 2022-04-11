## Description of the project

Read the full article: https://www.mohammadfaisal.dev/blog/request-validation-nodejs-express

Today we will learn how to validate incoming requests in an express application.

There are many options to do this. But we will use [class-validator](https://www.npmjs.com/package/class-validator) as it better supports typescript.

### Get a basic express application

Run the following command to get a basic express application that has the basic error handling set up. If you want to know more about how we did that you can refer to [here](https://www.mohammadfaisal.dev/blog/error-handling-nodejs-express)

```sh
git clone https://github.com/Mohammad-Faisal/nodejs-expressjs-error-handling
```

### Install the dependencies

Lets first install the required dependencies.

```sh
yarn add class-validator class-transformer
```

Then create a new file named **CreateUserRequest.ts** and add the following code there.

```js
import { IsDefined } from 'class-validator';

export class CreateUserRequest {
  @IsDefined()
  userName!: string;
}
```

You will get a warning for adding decorators. Open up your **tsconfig.json** fila and add the following value to get rid of that warning.

```json
"compilerOptions": {
  "experimentalDecorators": true
},
```

Here we have used **@IsDefined()** decorator provided by class-validator to tell that we need this **userName** property as a mendatory part of the request object.

### Convert the body into class

We know that in a post request the request.body comes in as a json object. We first need to convert that into a class and then run the validation.

1. Convert the json request body into class using class-transformer.
2. Run the validation with class-validator

```js
import { plainToInstance, Expose } from 'class-transformer';
import { validate, Matches, IsDefined } from 'class-validator';

const converterObject = plainToInstance(req.body);

validate(convertedObject).then((errors) => {
  console.log(errors);
});
```

Let's add this code into a route.

```js
app.post('/create-user', async (req: Request, res: Response, next: NextFunction) => {
  const convertedObject = plainToInstance(CreateUserRequest, req.body);

  validate(convertedObject).then((errors) => {
    if (errors.length > 0) {
      let rawErrors: string[] = [];
      for (const errorItem of errors) {
        rawErrors = rawErrors.concat(...rawErrors, Object.values(errorItem.constraints ?? []));
      }
      const validationErrorText = 'Request validation failed!';
      next(new BadRequestError(validationErrorText, rawErrors));
    } else {
      res.status(200).send({
        message: 'Hello World from create user!',
      });
    }
  });
});
```

You will notice we are passing the error handling capability into the error handling middleware by calling the **next()** function. We are also using a custom Error object named **BadRequest** error.

Let's add a new parameter named rawErrors into our **ApiError** class which is our custom error class to add the list of errors.

```js
export class ApiError extends Error {
  statusCode: number;
  rawErrors: string[] = [];
  constructor(statusCode: number, message: string, rawErrors?: string[]) {
    super(message);

    this.statusCode = statusCode;
    if (rawErrors) this.rawErrors = rawErrors;
    Error.captureStackTrace(this, this.constructor);
  }
}

// new optional class for bad requests
export class BadRequestError extends ApiError {
  constructor(message: string, errors: string[]) {
    super(StatusCodes.BAD_REQUEST, message, errors);
  }
}
```

Now if you make a request to the **http://localhost:3001/create-user** URL with a body without **userName** you will receive this response.

```json
{
  "success": false,
  "message": "Request validation failed!",
  "rawErrors": ["userName should not be null or undefined"]
}
```

Thats great! . Now we can validate our incoming requests very easily.

Let's make our code a little bit better by creating a RequestValidator class.

```js
import { Request, Response, NextFunction } from 'express';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BadRequestError } from './ApiError';

export default class RequestValidator {
  static validate = <T extends object>(classInstance: ClassConstructor<T>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const convertedObject = plainToInstance(classInstance, req.body);
      await validate(convertedObject).then((errors) => {
        if (errors.length > 0) {
          let rawErrors: string[] = [];
          for (const errorItem of errors) {
            rawErrors = rawErrors.concat(...rawErrors, Object.values(errorItem.constraints ?? []));
          }
          const validationErrorText = 'Request validation failed!';
          console.log('error found!', rawErrors);
          next(new BadRequestError(validationErrorText, rawErrors));
        }
      });
      next();
    };
  };
}
```

This way we can centralize our validation logics. And let's use it inside the routes.

```js
app.post('/create-user', RequestValidator.validate(CreateUserRequest), async (req: Request, res: Response) => {
  res.status(200).send({
    message: 'Hello World from post!',
  });
});
```

So Now we can just create our validation objects and pass them to our route handlers to validate incoming requests.

That's it for today. I hope you learned something new today!
