// these will be imported when a user adds the widget to an Experience Builder application

import { ImmutableObject } from 'seamless-immutable'

// the public facing url
export const MAPS_ONLINE_URL = 'https://mapsonline.information.qld.gov.au/service/environment/resource/MapsOnline/1/http/rest/'
// the internal only url gives access to internal reports
export const MAPS_ONLINE_URL_INT = 'https://encompass/mapsonline/service/all/service.svc/rest/'

// UAT url is https://mapsonline-uat.information.qld.gov.au/service/environment/resource/MapsOnline/1/http/rest/

// these variables are used in the radio-buttons component. the form is expanded if the user selects a graphic from one of these layers
export const DCDB_FEATURE_TYPE = 'LotPlan'
export const PROTECTED_AREA_TYPE = 'PAName'
export const NATURE_REFUGES_TYPE = 'NRName'

export interface config {
  appName?: string,
  enableRadioBtns?: boolean,
  internalApp?: boolean,
}

export type IMConfig = ImmutableObject<config>;

// the expected response from the api call getReportTypes
export interface ReportObject {
  allowGeoJson: boolean;
  allowedFeatureTypes: string[];
  applicationTags?: string[] | null;
  description: string;
  formatTypes: string[];
  industryTags?: string[] | null;
  infoUrl: string;
  maxGeoJsonAreaSkm: number;
  maxLine: number;
  maxPoint: number;
  maxPolygon: number;
  maxText: number;
  minGeoJsonAreaSkm: number;
  name: string;
  reportTags?: string[] | null;
  type: string;
};

// the structure of the entire API response array
export type ReportObjectArray = ReportObject[];

// structure of the MapsOnline getFeatureTypes API response object
export interface FeatureObject {
  description: string;
  fields: string[];
  fieldsPretty: string[];
  geomType: string;
  layerNameAliases: string[];
  name: string;
  type: string;
};

// the structure of the entire API response array
export type FeatureObjectArray = FeatureObject[];