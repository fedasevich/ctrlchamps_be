import { DataSource } from 'typeorm';
import User from '../../entities/user.entity';

export async function runQuery(): Promise<void> {
    try {
        const dataSource = new DataSource({
            type: 'mysql',
            host: 'localhost',
            port: 3306,
            username: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: 'test',
            entities: [ User ],
            synchronize: true, // Note: Synchronize shouldn't be used in production
        });

        await dataSource.initialize();

        const userRepository = dataSource.getRepository(User);

        if (dataSource.isConnected) {
            console.log('Connected to the database!');
            const newUser = new User();

            newUser.name = 'John Doe';
            newUser.age = 25;
            await userRepository.save(newUser);

            const users = await userRepository
                .createQueryBuilder('user')
                .select([ 'user.id', 'user.name', 'user.age' ])
                .getMany();

            console.log('All users:', users);
        } else {
            console.error('Failed to connect to the database!');
        }

        await dataSource.destroy();
    } catch (error) {
        console.error('Error:', error);
    }
}
