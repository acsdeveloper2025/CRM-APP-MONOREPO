export interface Country {
  id: string;
  name: string;
  code: string;
  continent: string;
  createdAt: string;
  updatedAt: string;
  states?: State[];
}

export interface State {
  id: string;
  name: string;
  code: string;
  country: string;
  createdAt: string;
  updatedAt: string;
  cities?: City[];
  city_count?: number;
}

export interface City {
  id: string;
  name: string;
  state: string;
  country: string;
  createdAt: string;
  updatedAt: string;
  pincodes?: Pincode[];
  pincode_count?: number;
}

export interface PincodeArea {
  id: string;
  name: string;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pincode {
  id: string;
  code: string;
  area?: string; // Deprecated: kept for backward compatibility
  areas: PincodeArea[];
  cityId: string;
  cityName: string;
  state: string;
  country: string;
  createdAt: string;
  updatedAt: string;
  city?: City;
}

export interface CreateCountryData {
  name: string;
  code: string;
  continent: string;
}

export interface UpdateCountryData {
  name?: string;
  code?: string;
  continent?: string;
}

export interface CreateStateData {
  name: string;
  code: string;
  country: string;
}

export interface UpdateStateData {
  name?: string;
  code?: string;
  country?: string;
}

export interface CreateCityData {
  name: string;
  state: string;
  country: string;
}

export interface UpdateCityData {
  name?: string;
  state?: string;
  country?: string;
}

export interface CreatePincodeData {
  code: string;
  area: string;
  cityId: string;
  cityName: string;
  state: string;
  country: string;
}

export interface UpdatePincodeData {
  code?: string;
  area?: string;
  cityId?: string;
}

export interface CreatePincodeAreaData {
  name: string;
  displayOrder?: number;
}

export interface UpdatePincodeAreaData {
  name: string;
  displayOrder?: number;
}

export interface ReorderPincodeAreasData {
  areaOrders: {
    id: string;
    displayOrder: number;
  }[];
}
