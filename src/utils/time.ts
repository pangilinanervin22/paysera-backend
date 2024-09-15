import { format } from "date-fns";

function calculateTimePassed(startDate: Date, endDate: Date): number {

    if (startDate > endDate) {
        throw new Error('Start date cannot be greater than end date');
    }

    const timeDiff = endDate.getTime() - startDate.getTime();
    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return days;
}

function calculateWorkHours(startDate: Date, endDate: Date, lunchStart: Date, lunchEnd: Date): number {
    if (startDate > endDate) {
        throw new Error('Start date cannot be greater than end date');
    }

    if (lunchStart > lunchEnd) {
        throw new Error('Lunch start time cannot be greater than lunch end time');
    }

    const totalWorkTime = endDate.getTime() - startDate.getTime();
    const lunchTime = lunchEnd.getTime() - lunchStart.getTime();
    const workTimeWithoutLunch = totalWorkTime - lunchTime;
    const workHours = Math.floor(workTimeWithoutLunch / (1000 * 60 * 60));

    return workHours;
}

export { calculateTimePassed, calculateWorkHours };

function formatDate(date: Date): string {
    return format(date, 'MMMM d, yyyy'); // Same format: September 15, 2024
}

export { formatDate };