import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-squad',
  imports: [
    MatTableModule
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
