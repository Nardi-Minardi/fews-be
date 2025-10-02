import { HttpException, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ValidationService } from 'src/common/validation.service';
import { Logger } from 'winston';
import { UserValidation } from './user.validation';
import { GetUserRequestDto, GetUserResponseDto } from './dto/get.user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private validationService: ValidationService,
    private userRepository: UserRepository,
  ) {}

  async getUserById(request: GetUserRequestDto): Promise<GetUserResponseDto> {
    this.logger.debug('Fetching user by Id', request);
    const getRequest: GetUserRequestDto = this.validationService.validate(
      UserValidation.USER_ID,
      request,
    );

    // Get user
    const user = await this.userRepository.findById(getRequest.userId);
    if (!user) {
      this.logger.error(`User with Id ${getRequest.userId} not found`);
      throw new HttpException('User not found', 404);
    }

    return {
      id: user.id,
      created_at: user.created_at,
      updated_at: user.updated_at,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      no_telp: user.no_telp,
      npwp: user.npwp,
      tmpt_lahir: user.tmpt_lahir,
      tgl_lahir: user.tgl_lahir,
      jns_kelamin: user.jns_kelamin,
      agama: user.agama,
      alamat: user.alamat,
      id_prov: user.id_prov,
      id_kab: user.id_kab,
      id_kec: user.id_kec,
      id_kel: user.id_kel,
      rt: user.rt,
      rw: user.rw,
      kode_pos: user.kode_pos,
      nip: user.nip,
    };
  }
}
