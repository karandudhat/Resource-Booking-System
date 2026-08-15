import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

export const DB_POOL = 'DB_POOL';

/**
 * DatabaseModule: provides a raw pg.Pool to every other module.
 *
 * We use raw pg (not TypeORM/Prisma) so we can write the EXCLUSION
 * CONSTRAINT violation catch (err.code === '23P01') directly in
 * the bookings service without ORM abstraction getting in the way.
 */
@Global()
@Module({
  providers: [
    {
      provide: DB_POOL,
      useFactory: async () => {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 20,               // max pool size for concurrency tests
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        });

        // Verify connectivity on startup
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log('✅ PostgreSQL connected');

        return pool;
      },
    },
  ],
  exports: [DB_POOL],
})
export class DatabaseModule {}
