export type TActiveMedicationOrder = {
  uuid: string;
  orderNumber: string;
  accessionNumber: null;
  patient: CareSetting;
  action: string;
  careSetting: CareSetting;
  previousOrder: null;
  dateActivated: string;
  scheduledDate: null;
  dateStopped: null;
  autoExpireDate: string;
  orderType: OrderType;
  encounter: CareSetting;
  encounterDateTime: string;
  orderer: Orderer;
  orderReason: null;
  orderReasonNonCoded: null;
  urgency: string;
  instructions: null;
  commentToFulfiller: null;
  drug: Drug;
  dose: number;
  doseUnits: CareSetting;
  frequency: CareSetting;
  asNeeded: boolean;
  asNeededCondition: null;
  quantity: number;
  quantityUnits: CareSetting;
  numRefills: number;
  dosingInstructions?: string;
  duration: number;
  durationUnits: CareSetting;
  route: CareSetting;
  brandName: null;
  dispenseAsWritten: boolean;
};

type CareSetting = {
  uuid: string;
  display: string;
  links: Link[];
};

type Link = {
  rel: Rel;
  uri: string;
  resourceAlias: string;
};

enum Rel {
  Full = "full",
  Self = "self",
}

type Drug = {
  uuid: string;
  display: string;
  strength: string;
  dosageForm: DosageForm;
  concept: Concept;
};

type Concept = {
  display: string;
  uuid: string;
  names: Name[];
};

type Name = {
  name: string;
};

type DosageForm = {
  display: string;
  uuid: string;
};

type OrderType = {
  uuid: string;
  display: string;
  name: string;
  javaClassName: string;
  retired: boolean;
  description: string;
  conceptClasses: CareSetting[];
  parent: null;
  links: Link[];
  resourceVersion: string;
};

type Orderer = {
  uuid: string;
  display: string;
  person: Person;
};

type Person = {
  display: string;
};
