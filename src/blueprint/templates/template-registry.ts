import { VillaA } from "./villa/villa-a";
import { VillaB } from "./villa/villa-b";
import { VillaC } from "./villa/villa-c";
import { HouseA } from "./house/house-a";
import { HouseB } from "./house/house-b";
import { DuplexA } from "./duplex/duplex-a";
import { OfficeA } from "./office/office-a";
import { ApartmentA } from "./apartment/apartment-a";

export const villaTemplates = [VillaA, VillaB, VillaC];
export const houseTemplates = [HouseA, HouseB];
export const duplexTemplates = [DuplexA];
export const officeTemplates = [OfficeA];
export const apartmentTemplates = [ApartmentA];

export const allTemplates = [
  ...villaTemplates,
  ...houseTemplates,
  ...duplexTemplates,
  ...officeTemplates,
  ...apartmentTemplates,
];
