import { CoreAPIClient } from 'fsm-sdk';
import * as moment from 'moment';
import { BookingRequest } from './booking.controller';
import { ActivityActionsRequest } from './service-management.model';

export class DTOBuilder {

  private _externalId: string

  constructor(private _br: BookingRequest) {
    this._externalId = `delete-me-${CoreAPIClient.createUUID()}`;
  }

  public static from(br: BookingRequest) {
    return new DTOBuilder(br);
  }

  public buildPlanningRelatedObjects() {
    const businessPartner = this.businessPartner();
    const address = this.address(businessPartner.id);
    const serviceCall = this.serviceCall(businessPartner.id);
    const activity = this.activity(serviceCall.id, businessPartner.id, address.id);

    return { businessPartner, address, serviceCall, activity };
  }

  private activity(serviceCallId: string, businessPartnerId: string, addressId: string) {
    return {
      "id": CoreAPIClient.createUUID(),
      "subject": "PLACEHOLDER",
      "externalId": this._externalId, // ID from S4 
      "contact": null,

      "responsibles": [], // is set on planing

      "object": {
        "objectId": serviceCallId,
        "objectType": "SERVICECALL"
      },
      "code": null,
      "businessPartner": businessPartnerId,
      "createDateTime": null,
      "address": addressId,
      "durationInMinutes": this._br.job.durationMinutes,

      "startDateTime": this._br.bookable.start,
      "endDateTime": this._br.bookable.end,
      "earliestStartDateTime": this._br.bookable.slot.start, // slot start
      "dueDateTime": moment.utc(this._br.bookable.slot.end).add(this._br.job.durationMinutes, 'minutes').toISOString(),  // slot end + duration

      "travelTimeFromInMinutes": null,
      "travelTimeToInMinutes": this._br.bookable.trip.durationInMinutes,

      // to be able to plan activity 
      // -> status(DRAFT) && executionStage(DISPATCHING) && responsibles[] empty 
      "status": "DRAFT", // CLOSED | OPEN | DRAFT
      "executionStage": "DISPATCHING", // PLANNING | DISPATCHING | EXECUTION | CLOSED | CANCELLED,
      "type": "ASSIGNMENT",

      "checkedOut": false,
      "inactive": false,
      "lastChanged": null,
      "personal": false,
      "autoSchedulingStatus": null,
      "shift": null,
      "project": null,
      "owners": null,
      "businessProcessStepAssignments": [],
      "syncObjectKPIs": null,
      "number": null,
      "internalRemarks2": null,
      "reminderDateTime": null,
      "changelog": null,
      "equipment": null,
      "branches": null,
      "predecessorActivities": [],
      "internalRemarks": null,
      "udfMetaGroups": null,
      "topic": null,
      "subType": null,
      "region": null,
      "previousActivity": null,
      "projectOrdinal": null,
      "projectPhase": null,
      "sourceActivity": null,
      "scope": null,
      "autoSchedulingError": null,
      "serviceWorkflow": null,
      "timeZoneId": null,
      "activityTemplate": null,
      "groups": null,
      "team": null,
      "hazardType": null,
      "milestone": false,
      "location": null,
      "udfValues": [],
      "remarks": null
    }
  }

  private serviceCall(businessPartnerId: string) {
    return {
      "id": CoreAPIClient.createUUID(),
      "subject": "PLACEHOLDER",
      "externalId": this._externalId,
      "startDateTime": this._br.bookable.slot.start, // stot-start not job
      "endDateTime": this._br.bookable.slot.end, // slot-end not job
      "dueDateTime": moment.utc(this._br.bookable.slot.end).add(this._br.job.durationMinutes, 'minutes').toISOString(),
      "businessPartner": businessPartnerId,
      "responsibles": [],

      "priority": "MEDIUM",

      "typeName": "Repair",
      "typeCode": "-1",

      "originCode": "-3",
      "originName": "Web Portal",

      "statusName": "Ready to plan",
      "statusCode": "-2",

      "inactive": false,
      "equipments": [],
      "leader": null,
      "chargeableEfforts": false,
      "project": null,
      "owners": null,
      "objectGroup": null,
      "resolution": null,
      "syncObjectKPIs": null,

      "partOfRecurrenceSeries": null,
      "contact": null,
      "problemTypeName": null,
      "problemTypeCode": null,
      "changelog": null,
      "branches": null,
      "salesOrder": null,
      "salesQuotation": null,
      "udfMetaGroups": null,
      "orderReference": null,
      "code": null,
      "projectPhase": null,
      "technicians": [],
      "chargeableMileages": false,
      "chargeableMaterials": false,
      "orderDateTime": null,
      "chargeableExpenses": false,
      "lastChanged": null,
      "serviceContract": null,
      "createPerson": null,

      "groups": null,
      "team": null,
      "createDateTime": null,
      "location": null,
      "udfValues": null,
      "incident": null,
      "remarks": null,
    }
  }

  private businessPartner() {
    return {
      "id": CoreAPIClient.createUUID(),
      "name": "Created for Job",
      "externalId": this._externalId,
      "type": "CUSTOMER",
      "language": "DE",
      "inactive": false,
      "country": null,
      "code": null,
      "city": null,
      "shippingType": null,
      "owners": null,
      "paymentType": null,
      "priceList": null,
      "syncObjectKPIs": null,
      "emailAddress": null,
      "password": null,
      "officePhone": null,
      "creditLimit": null,
      "validityComment": null,
      "currency": null,
      "fax": null,
      "groupCode": null,
      "website": null,
      "lastChanged": null,
      "groups": null,
      "branches": null,
      "groupName": null,
      "salesPersons": [],
      "mobilePhone": null,
      "otherPhone": null,
      "udfMetaGroups": null,
      "location": null,
      "udfValues": null,
      "additionalName": null,
      "paymentTerm": null,
      "remarks": null,
    }
  }

  private address(businessPartnerId: string) {
    return {
      "id": CoreAPIClient.createUUID(),
      "name": 'PLACEHOLDER', // fill with propper value
      "externalId": this._externalId,
      "defaultAddress": true,
      "location": this._br.job.location,
      "object": {
        "objectId": businessPartnerId,
        "objectType": "BUSINESSPARTNER"
      },
      "type": "SHIPTO",
      "country": null, // fill with propper value
      "zipCode": null, // fill with propper value
      "street": null, // fill with propper value
      "streetNo": null, // fill with propper value
      "city": null, // fill with propper value
      "county": null, // fill with propper value
      "inactive": false,
      "owners": null,
      "building": null,
      "syncObjectKPIs": null,
      "postOfficeBox": null,
      "block": null,
      "state": null,
      "floor": null,
      "lastChanged": null,
      "groups": null,
      "branches": null,
      "room": null,
      "createDateTime": null,
      "name3": null,
      "udfMetaGroups": null,
      "udfValues": null,
      "name2": null,
      "remarks": null,
    }
  }

  public buildPlanningRequest(): ActivityActionsRequest {

    return {
      duration: this._br.job.durationMinutes,
      plannedDurationInMinutes: this._br.job.durationMinutes,
      resolution: null,
      startDateTime: this._br.bookable.start,
      team: null,
      technician: {
        id: this._br.bookable.resource
        // code: string | null,
        // externalId: string | null,
      },
      travelTimeFromInMinutes: 0,
      travelTimeToInMinutes: 0,
      unit: null
    }
  }
}
