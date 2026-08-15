/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

export interface TeamStaffMember {
  personID: string;
  name?: string | null;
  surname?: string | null;
  nationID?: string | null;
  role: 'Manager' | 'Coach';
  wage: number;
  endDate?: string | null;
}
