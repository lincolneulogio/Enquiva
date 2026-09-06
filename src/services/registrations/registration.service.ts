import {
  type RegisterEventInput,
  type CheckInInput,
} from "./registration-types";
import { RegistrationBookingService } from "./registration-booking.service";
import { RegistrationCancelService } from "./registration-cancel.service";
import { RegistrationQueriesService } from "./registration-queries.service";
import { RegistrationOfflineService } from "./registration-offline.service";

export type { RegisterEventInput, CheckInInput };

export class RegistrationService {
  static registerForEvent = RegistrationBookingService.registerForEvent;
  static cancelRegistration = RegistrationCancelService.cancelRegistration;
  static checkInAttendee = RegistrationQueriesService.checkInAttendee;
  static getUserRegistrations = RegistrationQueriesService.getUserRegistrations;
  static getEventAttendees = RegistrationQueriesService.getEventAttendees;
  static getRegistrationForEvent = RegistrationQueriesService.getRegistrationForEvent;
  static registerOfflineAttendee = RegistrationOfflineService.registerOfflineAttendee;
}
