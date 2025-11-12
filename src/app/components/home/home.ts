import { Component } from '@angular/core';
import { DataTable } from '../shared/tables/data-table/data-table';

@Component({
  selector: 'app-home',
  imports: [
    DataTable
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  displayedColumnsFixtures = [
    { key: 'date', header: 'Date', width: '15%' },
    { key: 'homeaway', width: '5%' },
    { key: 'team', header: 'Team', align: 'end', headerClass:'text-end', cellClass:'text-end' }
  ];
  fixtures = [
    { date: '15/06', homeaway: 'H', team: "Red Ones" },
    { date: '19/06', homeaway: 'A', team: "Blue Team" },
    { date: '26/06', homeaway: 'H', team: "The Green Flag" },
  ];

  displayedColumns = [
    { key: 'name', header: 'Name', width: '30%' },
    { key: 'position', header: 'Position' },
    { key: 'age', header: 'Age', align: 'end', headerClass:'text-end', cellClass:'text-end' }
  ];
  people = [
    { name: 'Alice Johnson', age: 25, position: "CF" },
    { name: 'Bob Brown', age: 32, position: "CD" },
    { name: 'Charlie Core', age: 28, position: "GK" },
  ];
}
