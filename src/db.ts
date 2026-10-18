import Dexie, { type Table } from "dexie";

export interface Note {
  id?: number;
  title: string;
  content: string;
  subject: string;
  color: string;
}

class StudySyncDatabase extends Dexie {
  notes!: Table<Note, number>;

  constructor() {
    super("StudySyncDatabase");

    this.version(1).stores({
      notes: "++id, title, subject",
    });
  }
}

export const db = new StudySyncDatabase();