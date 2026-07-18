import { Transform } from 'class-transformer'
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator'

function trimValue({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value
}

export class CreateContactDto {
  @Transform(trimValue)
  @IsString()
  @Length(1, 120)
  name!: string

  @Transform(trimValue)
  @IsEmail()
  @MaxLength(320)
  email!: string

  @Transform(trimValue)
  @IsString()
  @Length(1, 5000)
  message!: string

  @Transform(trimValue)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  honeypot?: string
}
