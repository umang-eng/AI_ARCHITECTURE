export const FURNITURE_PLACEMENT_RULES = {
  minWalkwayWidth: 2.2, // Walkway clearance in feet
  doorBuffer: 3.0,      // Minimum distance from door centers
  windowBlockingAllowedTypes: ["single_bed", "queen_bed", "king_bed", "study_desk", "coffee_table"], // Wardrobes, TV Units cannot block windows
  tvSofaMaxDistance: 15, // Maximum distance in feet between TV Unit and Sofa
  deskNearWindowMaxDistance: 6.0,
};

export interface PlacementRuleReport {
  satisfied: boolean;
  message: string;
  ruleCode: string;
}
