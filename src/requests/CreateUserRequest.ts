import { IsDefined } from 'class-validator';

export class CreateUserRequest {
  @IsDefined()
  userName!: string;
}
