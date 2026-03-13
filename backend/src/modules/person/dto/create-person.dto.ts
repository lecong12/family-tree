import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { Gender } from '../../../constants';

export class CreatePersonDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(Gender)
    @IsNotEmpty()
    gender: Gender;

    @IsString()
    @IsNotEmpty()
    cccd: string;

    @IsOptional()
    @IsDateString()
    birth?: Date;

    @IsOptional()
    @IsDateString()
    death?: Date;

    @IsOptional()
    @IsBoolean()
    isDead?: boolean;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    desc?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    job?: string;
}