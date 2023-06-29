import fetch from "node-fetch";

export enum VisitType {
  PassportAndIdentityCardSubmission = "KL45_02",
  PassportAndIdentityCardCollection = "KL45_03",
  VisaApplicationSubmission = "KL45_04",
  CollectionOfDocumentsOfForeigners = "KL45_10",
  ConsultationOnMigration = "KL45_13",
  PersonalisingResidencePermit = "KL45_14",
  IltuCodeAssignment = "KL45_24",
}

// Dates - https://www.migracija.lt/external/tickets/classif//{VisitType}/dates?t={Date.now()}
// Institutions - https://www.migracija.lt/external/tickets/classif/{VisitType}/institutions

const BASE_API_URL = "https://www.migracija.lt/external/tickets/classif";

export interface Institution {
  key: string;
  code: string;
  titleLt: string;
  titleEn: string;
  properties: {
    ORG_UNIT_IDS: string;
    INSTITUTION_UNIT_TYPE: string;
    TAR_KODAS: string;
  };
}

export async function fetchInstitutions(
  visitType: VisitType
): Promise<Institution[]> {
  return await fetchJson(`${BASE_API_URL}/${visitType}/institutions`);
}

export async function fetchDates(
  visitType: VisitType,
  institution: string
): Promise<string[]> {
  return await fetchJson(
    `${BASE_API_URL}/${visitType}/${institution}/dates?t=${Date.now()}`
  );
}

async function fetchJson(url: string) {
  return await fetch(url).then((res) => res.json());
}
