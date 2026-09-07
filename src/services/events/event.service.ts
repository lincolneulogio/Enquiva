import {
  type PublicEventsResult,
  type EventWithAttendeeCount,
  confirmedAttendeeStatus,
  activeOccupyingStatus,
} from "./event-shared";
import { EventMutationsService } from "./event-mutations.service";
import { EventCatalogService } from "./event-catalog.service";
import { EventDiscoveryService } from "./event-discovery.service";

export type { PublicEventsResult, EventWithAttendeeCount };
export { confirmedAttendeeStatus, activeOccupyingStatus };

export class EventService {
  static getCategories = EventCatalogService.getCategories;
  static getTopCategories = EventCatalogService.getTopCategories;
  static getPublicEvents = EventCatalogService.getPublicEvents;
  static getFeaturedPublicEvents = EventCatalogService.getFeaturedPublicEvents;
  static getEventBySlug = EventCatalogService.getEventBySlug;

  static createEvent = EventMutationsService.createEvent;
  static updateEvent = EventMutationsService.updateEvent;
  static deleteEvent = EventMutationsService.deleteEvent;

  static getOrganizerEvents = EventDiscoveryService.getOrganizerEvents;
  static getOrganizerDashboardSnapshot = EventDiscoveryService.getOrganizerDashboardSnapshot;
  static getUpcomingLaunches = EventDiscoveryService.getUpcomingLaunches;
  static getPremierExperiences = EventDiscoveryService.getPremierExperiences;
  static getTopOrganizations = EventDiscoveryService.getTopOrganizations;
  static getCatalogHeroFeatures = EventDiscoveryService.getCatalogHeroFeatures;
}
