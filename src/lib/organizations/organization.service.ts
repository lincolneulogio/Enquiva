import type { ActiveOrganizationMembership } from "./active-membership";
import {
  type SignupIntentPayload,
  serializeSignupIntent,
  parseSignupIntent,
} from "./organization-utils";
import { OrganizationCoreService } from "./organization-core.service";
import { OrganizationMembershipService } from "./organization-membership.service";
import { OrganizationRequestsService } from "./organization-requests.service";
import { OrganizationTeamService } from "./organization-team.service";
import { OrganizationUsersAdminService } from "./organization-users-admin.service";

export type { SignupIntentPayload, ActiveOrganizationMembership };

export class OrganizationService {
  static getByInviteCode = OrganizationCoreService.getByInviteCode;
  static listActiveOrganizations = OrganizationCoreService.listActiveOrganizations;
  static getOrganizationForUser = OrganizationCoreService.getOrganizationForUser;
  static isOrgAdmin = OrganizationCoreService.isOrgAdmin;
  static updateOrganizationName = OrganizationCoreService.updateOrganizationName;
  static createOrganizationForAdmin = OrganizationCoreService.createOrganizationForAdmin;

  static listActiveMembershipsForUser = OrganizationMembershipService.listActiveMembershipsForUser;
  static switchActiveOrganization = OrganizationMembershipService.switchActiveOrganization;
  static syncUserRoleWithOrganizationMembership = OrganizationMembershipService.syncUserRoleWithOrganizationMembership;
  static getOrgMembershipMap = OrganizationMembershipService.getOrgMembershipMap;
  static getMembershipSummaryForUsers = OrganizationMembershipService.getMembershipSummaryForUsers;

  static requestJoinOrganizationAsOrganizer = OrganizationRequestsService.requestJoinOrganizationAsOrganizer;
  static joinOrganizationAsOrganizer = OrganizationRequestsService.joinOrganizationAsOrganizer;
  static approveOrganizerRequest = OrganizationRequestsService.approveOrganizerRequest;
  static rejectOrganizerRequest = OrganizationRequestsService.rejectOrganizerRequest;
  static listPendingOrganizerRequests = OrganizationRequestsService.listPendingOrganizerRequests;
  static getPendingOrganizerMembershipForUser = OrganizationRequestsService.getPendingOrganizerMembershipForUser;
  static activateIndependentOrganizer = OrganizationRequestsService.activateIndependentOrganizer;

  static promoteUserInOrg = OrganizationTeamService.promoteUserInOrg;
  static listTeamMembers = OrganizationTeamService.listTeamMembers;
  static getOrganizerIdsInOrg = OrganizationTeamService.getOrganizerIdsInOrg;
  static countOrganizerSlotsInOrg = OrganizationTeamService.countOrganizerSlotsInOrg;
  static validateOrganizerInviteForSignup = OrganizationTeamService.validateOrganizerInviteForSignup;

  static countOrganizationUsersForAdmin = OrganizationUsersAdminService.countOrganizationUsersForAdmin;
  static listOrganizationUsersForAdmin = OrganizationUsersAdminService.listOrganizationUsersForAdmin;

  static serializeSignupIntent = serializeSignupIntent;
  static parseSignupIntent = parseSignupIntent;
}
