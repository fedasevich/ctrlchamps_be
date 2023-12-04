import { IsNotEmpty, IsArray } from 'class-validator';

import { WorkExperienceDto } from './work-experience.dto';

export class CreateWorkExperienceDto {
  @IsArray()
  @IsNotEmpty()
  workExperiences: WorkExperienceDto[];
}
