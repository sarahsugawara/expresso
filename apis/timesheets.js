const express = require('express');
const timesheetsRouter = express.Router(
    {
        mergeParams: true
    }
);

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const pp = x => JSON.stringify(x, null, 2);

timesheetsRouter.get('/', (req, res, next) => {
    const employeeId = req.params.employeeId;
    db.all(`SELECT * FROM Timesheet WHERE employee_id = $employeeId`,
    {
        $employeeId: employeeId
    },
    (err, rows) => {
        if (err) {
            next(err);
        }
        else {
            res.status(200).send({ timesheets: rows });
        }
    });
});

timesheetsRouter.post('/', (req, res, next) => {
    const timesheet = req.body.timesheet;
    const hours = timesheet.hours;
    const rate = timesheet.rate;
    const date = timesheet.date;
    const employeeId = req.params.employeeId;
    
    db.get(`SELECT * FROM Timesheet WHERE id = $employeeId`, 
    {
        $employeeId: employeeId
    },
    (err, row) => {
        if (err) {
            next(err);
        }
        else {
            if (!hours || !rate || !date || !row) {
                return res.status(400).send();
            }
        }
    });
    db.run(`INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)`,
    {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employeeId: employeeId
    },
    function(err) {
        if (err) {
            next(err);
        }
        else {
            db.get(`SELECT * FROM Timesheet WHERE id = $id`,
            {
                $id: this.lastID
            },
            (err, row) => {
                res.status(201).send({ timesheet: row });
            });
        }
    });
});

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
    db.get("SELECT * FROM Timesheet WHERE id = $timesheetId", 
    {
        $timesheetId: timesheetId
    },
    (err, row) => {
        if (err) {
            next(err);
        }
        else if (row) {
            next();
        }
        else {
            res.status(404).send();
        }
    })
});

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
    const timesheetId = req.params.timesheetId;
    const timesheet = req.body.timesheet;
    const hours = timesheet.hours;
    const rate = timesheet.rate;
    const date = timesheet.date;
    const employeeId = timesheet.employeeId;
    
    db.get(`SELECT * FROM Timesheet WHERE id = $timesheetId`, 
    {
        $timesheetId: timesheetId
    },
    (err, row) => {
        if (err) {
            next(err);
        }
        else {
            if (!hours || !rate || !date || !row) {
                return res.status(400).send();
            }
        }
    });
    db.run(`UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employeeId = $employeeId WHERE id = $id`,
    {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employeeId: employeeId,
        $id: timesheetId
    },
    function (err) {
        if (err) {
            next(err);
        }
        else {
            db.get(`SELECT * FROM Timesheet WHERE id = $id`, 
            {
                $id: timesheetId
            },
            (err, row) => {
                if (err) {
                    res.status(400).send();
                }
                res.status(200).send({ timesheet: row });
            });
        }
    });
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    const timesheetId = req.params.timesheetId;
    db.run(`DELETE FROM Timesheet WHERE id = ${timesheetId}`,
    (err) => {
        if (err) {
            next(err);
        }
        else {
            res.status(204).send();
        }
    });
});



module.exports = timesheetsRouter;