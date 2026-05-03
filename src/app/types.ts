// Data types for the application

export interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  dateRegistered: string;
  programs: string[];
}

export interface Program {
  id: string;
  name: string;
  description: string;
  schedule: string;
}

export interface AttendanceRecord {
  id: string;
  participantId: string;
  programId: string;
  date: string;
  present: boolean;
}
