import { PaymentCheckoutService } from "./payment-checkout.service";
import { PaymentSubmissionService } from "./payment-submission.service";
import { PaymentStatusService } from "./payment-status.service";
import { PaymentQueriesService } from "./payment-queries.service";

export class PaymentService {
  static createPayment = PaymentSubmissionService.createPayment;

  static getPaymentCheckoutContext = PaymentCheckoutService.getPaymentCheckoutContext;
  static getCheckoutPresentationContext = PaymentCheckoutService.getCheckoutPresentationContext;

  static updatePaymentStatus = PaymentStatusService.updatePaymentStatus;

  static getUserPayments = PaymentQueriesService.getUserPayments;
  static getPaymentForRegistration = PaymentQueriesService.getPaymentForRegistration;
  static getOrganizerPayments = PaymentQueriesService.getOrganizerPayments;
  static getAdminPayments = PaymentQueriesService.getAdminPayments;
  static getAdminPaymentsPaginated = PaymentQueriesService.getAdminPaymentsPaginated;
}
