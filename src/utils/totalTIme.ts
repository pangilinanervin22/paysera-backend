function CalculateTotalTime(body: any) {
    let totalHours = 0;
    let totalHoursWorked = 0;
    let totalLunchHours = 0;

    // Calculate total hours worked and lunch hours
    if (body.timeOut && body.lunchTimeOut) {
        totalHours = (body.timeOut.getTime() - body.timeIn.getTime()) / 1000 / 60 / 60;
        totalLunchHours = (body.lunchTimeOut.getTime() - body.lunchTimeIn.getTime()) / 1000 / 60 / 60;
        totalHoursWorked = totalHours - totalLunchHours;
    }

    return {
        totalHours,
        totalHoursWorked,
        totalLunchHours,
    };
}

// create a data object with timeIn timeOut lunchTimeIn lunchTimeOut properties
const data = {
    timeIn: new Date('2024-01-01T08:00:00'),
    timeOut: new Date('2024-01-01T18:00:00'),
    lunchTimeIn: new Date('2024-01-01T12:00:00'),
    lunchTimeOut: new Date('2024-01-01T13:00:00'),
};

// Calculate the total time
const totalTime = CalculateTotalTime(data);