import { RouteService } from "../route/route.service";
import { BookingQueriesService } from "../booking/booking-queries.service";
import { BookingService } from "../booking/booking.service";
import { TransportAdminService } from "../admin/admin.service";

export class TransportService {
  // Routes
  static getRoutesByEvent = RouteService.getRoutesByEvent;
  static createRoute = RouteService.createRoute;
  static updateRoute = RouteService.updateRoute;
  static deleteRoute = RouteService.deleteRoute;
  static toggleRouteActive = RouteService.toggleRouteActive;
  static toggleEventTransport = RouteService.toggleEventTransport;

  // Bookings / Queries
  static getMyTransportBookings = BookingQueriesService.getMyTransportBookings;
  static getMemberTransportOptions = BookingQueriesService.getMemberTransportOptions;

  // Bookings / Transactions
  static bookTransport = BookingService.bookTransport;
  static cancelTransportBooking = BookingService.cancelTransportBooking;

  // Admin
  static getTransportBookingsForEvent = TransportAdminService.getTransportBookingsForEvent;
  static approveTransportPayment = TransportAdminService.approveTransportPayment;
  static rejectTransportPayment = TransportAdminService.rejectTransportPayment;
}
