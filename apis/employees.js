const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const pp = x => JSON.stringify(x, null, 2);

const timesheetsRouter = require('./timesheets.js');

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

employeesRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Employee WHERE is_current_employee = 1", (err, rows) => {
        if (err) {
            next(err);
        }
        else {
            res.status(200).send({ employees: rows });
        }
    });
});

employeesRouter.post('/', (req, res, next) => {
    const employee = req.body.employee;
    const name = employee.name;
    const position = employee.position;
    const wage = employee.wage;

    db.run(`INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $position, $wage, $employment)`, {
        $name: name,
        $position: position,
        $wage: wage,
        $employment: 1
    },
    function (err) {
        if (err) {
            res.status(400).send();
        }
        else {
            db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`,
            (err, row) => {
                if (err) {
                    res.status(400).send();
                }
                res.status(201).send({ employee: row });
            });
        }
    })
});

//*Validation of employee and sending info from database back into request
employeesRouter.param('employeeId', (req, res, next, employeeId) => {
    db.get("SELECT * FROM Employee WHERE id = $employeeId", 
    {
        $employeeId: employeeId
    },
    (err, row) => {
        if (err) {
            next(err);
        }
        else if (row) {
            req.employee = row;
            next();
        }
        else {
            res.status(404).send();
        }
    })
});

employeesRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).send({ employee: req.employee });
});

employeesRouter.put('/:employeeId', (req, res, next) => {
    const employeeId = req.params.employeeId;
    const employee = req.body.employee;
    const name = employee.name;
    const position = employee.position;
    const wage = employee.wage;
    const employment = employee.isCurrentEmployee === 0 ? 0 : 1;

    if (!name || !position || !wage) {
        res.status(400).send();
    }
    db.run(`UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $employment WHERE id = $id`,
    {
        $name: name,
        $position: position,
        $wage: wage,
        $employment: employment,
        $id: employeeId
    },
    function (err) {
        if (err) {
            res.status(404).send();
        }
        db.get(`SELECT * FROM Employee WHERE id = ${employeeId}`,
        (err, row) => {
            if (err) {
                res.status(404).send();
            }
            res.status(200).send({ employee: row });
        });
    })
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
    const employeeId = req.params.employeeId;
    db.run(`UPDATE Employee SET is_current_employee = 0 WHERE id = ${employeeId}`, 
    function (err) {
        if (err) {
            next(err);
        }
        else {
            db.get(`SELECT * FROM Employee WHERE id = ${employeeId}`,
            (err, row) => {
                if (err) {
                    res.status(404).send();
                }
                res.status(200).send({ employee: row });
            });
        }
    });
});


module.exports = employeesRouter;