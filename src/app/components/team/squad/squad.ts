import { Component } from '@angular/core';
import { DataTable } from "../../shared/tables/data-table/data-table";

@Component({
  selector: 'app-squad',
  imports: [
    DataTable
  ],
  templateUrl: './squad.html',
  styleUrl: './squad.css'
})
export class Squad {
  displayedColumns = [
    { key: 'name', header: 'Name', width: '30%', sortable: true },
    { key: 'position', header: 'Position' },
    { key: 'age', header: 'Age', align: 'end', headerClass:'text-end', cellClass:'text-end' }
  ];
  people = [
    { name: 'Alice Johnson', age: 25, position: "CF" },
    { name: 'Bob Brown', age: 32, position: "CD" },
    { name: 'Charlie Core', age: 28, position: "GK" },
  ];
}
