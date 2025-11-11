import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-data-table',
  imports: [
    MatTableModule,
    CommonModule
  ],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css'
})
export class DataTable<T> {
  @Input() data: T[] = [];
  @Input() columns: ColumnDef<T>[] = [];
  @Input() tableClass = 'app-table';  // applies your styling class

  get displayed() { return this.columns.map(c => c.key); }
}


export interface ColumnDef<T = any> {
  key: string;                     // property name in row
  header: string;                  // header text
  width?: string;
  align?: 'start'|'center'|'end';
  sticky?: boolean;
  headerClass?: string;
  cellClass?: string;
  // If provided, this renders the cell instead of default text:
  cellTemplate?: TemplateRef<{ $implicit: T; value: any }>;
}