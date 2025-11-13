import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-data-table',
  imports: [
    MatTableModule,
    CommonModule,
    MatSortModule
  ],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss'
})
export class DataTable<T> implements OnChanges{
  ngOnChanges(changes: SimpleChanges): void {
    this.renderedData = [...this.data];
    this.applySort();
  }
  @Input() data: T[] = [];
  @Input() columns: ColumnDef<T>[] = [];
  @Input() tableClass = 'app-table';
  private active = '';
  private direction: 'asc' | 'desc' | '' = '';
  renderedData: T[] = [];
  get displayed() { return this.columns.map(c => c.key); }

  onSort(e: Sort) {
    this.active = e.active;
    this.direction = e.direction;
    this.applySort();
  }

  private applySort() {
    if (!this.active || !this.direction) {
      this.renderedData = [...this.data];
      return;
    }
    const col = this.columns.find(c => c.key === this.active);
    if (!col) return;

    const accessor = col.sortAccessor
      ? (row: T) => col.sortAccessor!(row)
      : (row: T) => (row as any)[this.active];

    const cmp = col.comparator ?? defaultComparator;

    this.renderedData = [...this.data].sort((ra, rb) => {
      const a = accessor(ra);
      const b = accessor(rb);
      const result = cmp(a, b);
      return this.direction === 'asc' ? result : -result;
    });
  }
}

function defaultComparator(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (typeof a === 'number' && typeof b === 'number') return a - b;

  const ad = asDate(a), bd = asDate(b);
  if (ad && bd) return ad.getTime() - bd.getTime();

  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

function asDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v as any);
    return isNaN(+d) ? null : d;
  }
  return null;
}


export interface ColumnDef<T = any> {
  key: string;
  header: string;
  width?: string;
  align?: 'start'|'center'|'end';
  sticky?: boolean;
  headerClass?: string;
  cellClass?: string;
  cellTemplate?: TemplateRef<{ $implicit: T; value: any }>;
  sortable?: boolean;
  sortAccessor?: (row: T) => unknown;
  comparator?: (a: unknown, b: unknown) => number;
}