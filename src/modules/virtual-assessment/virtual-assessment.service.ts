import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Appointment } from 'src/common/entities/appointment.entity';
import { VirtualAssessment } from 'src/common/entities/virtual-assessment.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { Repository } from 'typeorm';

import { UpdateVirtualAssessmentStatusDto } from './dto/update-status.dto';
import { CreateVirtualAssessmentDto } from './dto/virtual-assessment.dto';

@Injectable()
export class VirtualAssessmentService {
  constructor(
    @InjectRepository(VirtualAssessment)
    private readonly virtualAssessmentRepository: Repository<VirtualAssessment>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async createVirtualAssessment(
    createVirtualAssessmentDto: CreateVirtualAssessmentDto,
  ): Promise<void> {
    try {
      const { startTime, endTime, assessmentDate, meetingLink, appointmentId } =
        createVirtualAssessmentDto;

      const appointment = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.user', 'user')
        .leftJoinAndSelect('appointment.caregiverInfo', 'caregiverInfo')
        .where('appointment.id = :id', { id: appointmentId })
        .getOne();

      if (!appointment) {
        throw new HttpException(
          ErrorMessage.AppointmentNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const virtualAssessment = this.virtualAssessmentRepository.create({
        appointment,
        startTime,
        endTime,
        assessmentDate,
        meetingLink,
      });

      await this.virtualAssessmentRepository.save(virtualAssessment);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          ErrorMessage.InternalServerError,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async findVirtualAssessmentById(
    appointmentId: string,
  ): Promise<VirtualAssessment> {
    try {
      const virtualAssessment = await this.virtualAssessmentRepository
        .createQueryBuilder('virtualAssessment')
        .leftJoinAndSelect('virtualAssessment.appointment', 'appointment')
        .where('appointment.id = :id', { id: appointmentId })
        .getOne();

      if (!virtualAssessment) {
        throw new HttpException(
          ErrorMessage.VirtualAssessmentNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      return virtualAssessment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          ErrorMessage.InternalServerError,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async deleteVirtualAssessment(appointmentId: string): Promise<void> {
    try {
      const virtualAssessment =
        await this.findVirtualAssessmentById(appointmentId);

      await this.virtualAssessmentRepository.remove(virtualAssessment);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          ErrorMessage.InternalServerError,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async updateStatus(
    appointmentId: string,
    updateStatusDto: UpdateVirtualAssessmentStatusDto,
  ): Promise<void> {
    try {
      const virtualAssessment =
        await this.findVirtualAssessmentById(appointmentId);

      if (!virtualAssessment) {
        throw new HttpException(
          ErrorMessage.VirtualAssessmentNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      virtualAssessment.status = updateStatusDto.status;

      await this.virtualAssessmentRepository.save(virtualAssessment);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          ErrorMessage.InternalServerError,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
