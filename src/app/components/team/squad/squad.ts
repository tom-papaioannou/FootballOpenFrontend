import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { DataTable } from "../../shared/tables/data-table/data-table";

@Component({
  selector: 'app-squad',
  imports: [
    MatTableModule,
    DataTable
],
  templateUrl: './squad.html',
  styleUrl: './squad.css'
})
export class Squad {
  displayedColumns: string[] = ['name', 'position', 'age'];
  people = [
    { name: 'Alice Johnson', age: 25, position: "CF" },
    { name: 'Bob Brown', age: 32, position: "CD" },
    { name: 'Charlie Core', age: 28, position: "GK" },
  ];
}
