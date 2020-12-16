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