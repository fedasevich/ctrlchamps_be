import { IsNotEmpty, IsNumber, IsString, Min, MinLength } from "class-validator";

export class LoginDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8, {
        message: 'Password must contain a minimum of eight characters',
    })
    password: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(18)
    age: number;
}

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8, {
        message: 'Password must contain a minimum of eight characters',
    })
    password: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(18)
    age: number;
}