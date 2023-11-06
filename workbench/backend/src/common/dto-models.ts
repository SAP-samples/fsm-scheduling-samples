export type TagDTO = {
  branches: null
  createDateTime: string
  createPerson: string
  description: null
  externalId: null
  groups: null
  id: string
  inactive: false
  lastChanged: number
  lastChangedBy: string
  location: null
  name: string
  owners: null
  syncObjectKPIs: null
  syncStatus: 'IN_CLOUD'
  udfMetaGroups: null
  udfValues: null
}

export type AddressDTO = {
  block: null
  branches: null
  building: null
  city: string
  country: string
  county: null
  createDateTime: string
  createPerson: string
  defaultAddress: true
  externalId: null
  floor: null
  groups: null
  id: string
  inactive: false
  lastChanged: number
  location: { latitude: number, longitude: number }
  name: string
  name2: null
  name3: null
  object: { objectId: string, objectType: string }
  owners: null
  postOfficeBox: null
  remarks: null
  room: null
  state: null
  street: string
  streetNo: string
  syncObjectKPIs: null
  syncStatus: 'IN_CLOUD'
  type: 'HOME'
  udfMetaGroups: null
  udfValues: null
  zipCode: string
}

export type AGHResponseDTO = { // TODO there are other DTOs using results: Array pattern, maybe merge as generic and reuse
  results: TechnicianDTO[]
}

export type AGHRequestDTO = {
  companyNames: string[],
  options: {
    geocodedOnly: boolean,
    includeInternalPersons: boolean,
    includeCrowdPersons: boolean
  },
  bookingsFilter: {
    earliest: string,
    latest: string,
    activitiesToExclude: string[],
    considerReleasedAsExclusive: boolean,
    considerPlannedAsExclusive: boolean
  },
  personIds: string[]
}

export type TechnicianDTO = {
  id: string,
  name: string;
  description: string;
  defaultPlugin: boolean;
  standardPlugin: boolean;
  pluginCode: string;
  scheduleConfigId: string;
}
