export type ISODateTime = string;

export type Trip = {
  id: string;
  user_id: string;
  flight_1_id: string | null;
  flight_2_id: string | null;
  monitoring_state: string;
  created_at: ISODateTime;
};

export type Flight = {
  id: string;
  airline: string;
  flight_number: string;
  origin_airport: string;
  destination_airport: string;
  scheduled_departure: ISODateTime | null;
  scheduled_arrival: ISODateTime | null;
  estimated_departure: ISODateTime | null;
  estimated_arrival: ISODateTime | null;
  status: string;
};

export type RecoveryPlan = {
  id: string;
  trip_id: string;
  recommended_flight: string | null;
  backup_flight: string | null;
  plan_status: string;
  created_at: ISODateTime;
};

export type Notification = {
  id: string;
  trip_id: string;
  type: string;
  message: string;
  sent_at: ISODateTime | null;
};

