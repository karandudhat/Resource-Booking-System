import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { DB_POOL } from '../config/database.config';
import { Resource, AvailabilityWindow } from '../models';

@Injectable()
export class ResourcesService {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async findAll(): Promise<Resource[]> {
    const result = await this.pool.query(
      'SELECT id, name, timezone FROM resources ORDER BY name',
    );
    return result.rows;
  }

  async findOne(id: string): Promise<Resource> {
    const result = await this.pool.query(
      'SELECT id, name, timezone FROM resources WHERE id = $1',
      [id],
    );
    if (!result.rows.length) {
      throw new NotFoundException(`Resource '${id}' not found`);
    }
    return result.rows[0];
  }

  async getAvailabilityWindows(resourceId: string): Promise<AvailabilityWindow[]> {
    const result = await this.pool.query(
      `SELECT day_of_week,
              to_char(start_time, 'HH24:MI') AS start_time,
              to_char(end_time,   'HH24:MI') AS end_time
       FROM   availability_windows
       WHERE  resource_id = $1
       ORDER  BY day_of_week`,
      [resourceId],
    );
    return result.rows;
  }
}
