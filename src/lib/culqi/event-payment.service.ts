import {
  type CulqiChargePayload,
  type CulqiOrderPayload,
  type CulqiProcessResult,
  findPaymentByChargeId,
  findPaymentByOrderId,
  findPaymentById,
} from "./event-payment-types";
import { EventPaymentReconcileService } from "./event-payment-reconcile.service";
import { EventPaymentProcessService } from "./event-payment-process.service";

export type { CulqiChargePayload, CulqiOrderPayload, CulqiProcessResult };

export class CulqiEventPaymentService {
  static findPaymentByChargeId = findPaymentByChargeId;
  static findPaymentByOrderId = findPaymentByOrderId;
  static findPaymentById = findPaymentById;

  static claimGatewayOperation = EventPaymentProcessService.claimGatewayOperation;
  static attachOrderToPayment = EventPaymentProcessService.attachOrderToPayment;
  static resolveCredentialsForPayment = EventPaymentProcessService.resolveCredentialsForPayment;
  static processCharge = EventPaymentProcessService.processCharge;
  static processOrder = EventPaymentProcessService.processOrder;

  static fulfillApprovedCharge = EventPaymentReconcileService.fulfillApprovedCharge;
  static reconcileChargeSuccess = EventPaymentReconcileService.reconcileChargeSuccess;
  static reconcileChargeFailure = EventPaymentReconcileService.reconcileChargeFailure;
  static reconcileRefund = EventPaymentReconcileService.reconcileRefund;
  static reconcileOrderPaid = EventPaymentReconcileService.reconcileOrderPaid;
}
