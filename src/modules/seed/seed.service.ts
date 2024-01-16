import { Injectable } from '@nestjs/common';

import { Activity } from 'src/common/entities/activity.entity';
import { Capability } from 'src/common/entities/capability.entity';
import { DefaultSeekerTask } from 'src/common/entities/default-seeker-task.entity';
import { Diagnosis } from 'src/common/entities/diagnosis.entity';
import { User } from 'src/common/entities/user.entity';
import { ACTIVITIES_SEED } from 'src/modules/seed/seed-data/activity.seed';
import { CAPABILITIES_SEED } from 'src/modules/seed/seed-data/capability.seed';
import { DIAGNOSES_SEED } from 'src/modules/seed/seed-data/diagnosis.seed';
import { TASKS_SEED } from 'src/modules/seed/seed-data/tasks.seed';
import { USERS_SEED } from 'src/modules/seed/seed-data/users.seed';
import { DeepPartial, EntityManager, EntityTarget } from 'typeorm';

@Injectable()
export class SeedingService {
  constructor(private readonly entityManager: EntityManager) {}

  async seed(): Promise<void> {
    await Promise.all([
      this.seedTable(Diagnosis, DIAGNOSES_SEED),
      this.seedTable(Activity, ACTIVITIES_SEED),
      this.seedTable(Capability, CAPABILITIES_SEED),
      this.seedTable(User, USERS_SEED),
      this.seedTable(DefaultSeekerTask, TASKS_SEED),
    ]);
  }

  private async seedTable<T>(
    entity: EntityTarget<T>,
    data: DeepPartial<T>[],
  ): Promise<void> {
    const existingData = await this.entityManager.count(entity);

    if (!existingData) {
      await this.entityManager.save(entity, data);
    }
  }
}
