import { IsEnum, IsUUID } from 'class-validator';
import { ActivityAnswer } from 'src/modules/appointment/enums/activity-answer.enum';

export class SeekerActivityDto {
  @IsUUID()
  id: string;

  @IsEnum(ActivityAnswer)
  answer: ActivityAnswer;
}
