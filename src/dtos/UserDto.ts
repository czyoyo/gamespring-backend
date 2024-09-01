export class CreateUserDto {
  username: string;
  password: string;
}

export class LoginUserDto {
  username: string;
  password: string;
}

export class UserResponseDto {
  id: number;
  username: string;
  createdAt: Date;
}
