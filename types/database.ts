export type UUID = string;
export type ISODateTime = string;

export interface TripRow {
  id: string;
  created_at: string;

  flight_number_f1: string;
  flight_number_f2: string;

  flight_id_f1: string | null;
  flight_id_f2: string | null;

  origin_airport: string;
  connection_airport: string;
  destination_airport: string;

  scheduled_departure_f1: string;
  scheduled_arrival_f1: string;

  scheduled_departure_f2: string;
  scheduled_arrival_f2: string;

  estimated_arrival_f1: string | null;
  estimated_departure_f2: string | null;

  actual_departure_f2: string | null;

  monitoring_state: string | null;
  connection_time_remaining: number | null;

  status: string;
}

export interface LandingPlanRow {
  id: UUID;
  trip_id: UUID;
  created_at: ISODateTime;
  primary_airline: string | null;
  primary_flight_number: string | null;
  primary_departure: ISODateTime | null;
  primary_arrival: ISODateTime | null;
  secondary_airline: string | null;
  secondary_flight_number: string | null;
  secondary_departure: ISODateTime | null;
  secondary_arrival: ISODateTime | null;
  reason: string | null;
}

export interface NotificationRow {
  id: UUID;
  trip_id: UUID;
  created_at: ISODateTime;
  type: string;
  message: string;
  read: boolean;
}

export interface RiskEventRow {
  id: UUID;
  trip_id: UUID;
  created_at: ISODateTime;
  previous_state: string | null;
  new_state: string | null;
  connection_time_remaining: number | null;
}

