export enum VirtualAssessmentApiPath {
  CreateVirtualAssessment = 'virtual-assessment',
  SingleVirtualAssessment = 'virtual-assessment/:appointmentId',
  RescheduleVirtualAssessment = 'virtual-assessment/reschedule/:appointmentId',
  UpdateVirtualAssessmentReschedulingStatus = 'virtual-assessment/reschedule/update-status/:appointmentId',
}
