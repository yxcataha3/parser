import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { UserMiddleware } from './middleware/user.middleware';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
  ],
  providers: [
    UserService,
    UserMiddleware,
  ],
  exports: [
    UserService,
    UserMiddleware,
  ]
})
export class UserModule {}
