import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isoWeek',
  standalone: true
})
export class IsoWeekPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    // Expected ISO format: YYYY-Www, e.g., 2026-W42
    const regex = /^(\d{4})-W(\d{1,2})$/;
    const match = value.match(regex);

    if (!match) {
      return value;
    }

    const year = match[1];
    const week = parseInt(match[2], 10);

    return `Semana ${week}, ${year}`;
  }
}
