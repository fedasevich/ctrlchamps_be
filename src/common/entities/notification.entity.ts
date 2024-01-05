// import { ApiProperty } from '@nestjs/swagger';

// import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

// import { User } from './user.entity';

// @Entity()
// export class Notification {
//   @ApiProperty({
//     description: 'Unique identifier for notification',
//     example: 'e02769c5-60c7-4c88-8372-6c2598f9a234',
//   })
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @ApiProperty({
//     description: 'Notification message',
//     example: 'New message received',
//   })
//   @Column()
//   message: string;

//   @ApiProperty({
//     description: 'Indicates whether the notification has been read',
//     example: 'false',
//   })
//   @Column({ default: false })
//   read: boolean;

//   @ApiProperty({
//     description: 'Timestamp for when the notification was created',
//     example: '2023-01-05T12:30:45.000Z',
//   })
//   @Column({ default: () => 'CURRENT_TIMESTAMP' })
//   createdAt: Date;

//   @ApiProperty({
//     description: 'Link to the associated user',
//     type: () => User, // Specify the type for the documentation
//   })
//   @ManyToOne(() => User, (user) => user.notifications)
//   user: User;
// }
