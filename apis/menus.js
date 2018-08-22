const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const pp = x => JSON.stringify(x, null, 2);

const itemsRouter = require('./menu-items.js');

menusRouter.use('/:menuId/menu-items', itemsRouter);

menusRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Menu",
    (err, rows) => {
        if (err) {
            next(err);
        }
        else {
            res.status(200).send({ menus: rows });
        }
    });
});

menusRouter.post('/', (req, res, next) => {
    const menu = req.body.menu;
    const title = menu.title;
    db.run(`INSERT INTO Menu (title) VALUES ($title)`, 
    {
        $title: title
    },
    function (err) {
        if (err) {
            res.status(400).send();
        }
        else {
            db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`,
            (err, row) => {
                if (err) {
                    res.status(400).send();
                }
                res.status(201).send({ menu: row });
            });
        }
    });
});

menusRouter.param('menuId', (req, res, next, menuId) => {
    db.get(`SELECT * FROM Menu WHERE id = ${menuId}`, 
    (err, row) => {
        if (err) {
            next(err);
        }
        else if (row) {
            req.menu = row;
            next();
        }
        else {
            res.status(404).send();
        }
    });
});

menusRouter.get('/:menuId', (req, res, next) => {
    res.status(200).send({ menu: req.menu });
});

menusRouter.put('/:menuId', (req, res, next) => {
    const menuId = req.params.menuId;
    const menu = req.body.menu;
    const title = menu.title;

    if (!menu || !title) {
        res.status(400).send();
    }
    db.run(`UPDATE Menu SET title = $title WHERE id = $id`,
    {
        $title: title,
        $id: menuId
    },
    function (err) {
        if (err) {
            next(err);
        }
        else {
            db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`,
            (err, row) => {
                if (err) {
                    res.status(400).send();
                }
                else {
                    res.status(200).send({ menu: row });
                }
            });
        }
    });
});

menusRouter.delete('/:menuId', (req, res, next) => {
    const menuId = req.body && req.params.menuId;
    db.get(`SELECT * FROM Menu WHERE id = ${menuId}`,
    (err, row) => {
        if (err) {
            next(err);
        }
        else if (row) {
            res.status(400).send();
        }
        else {
            db.run(`DELETE FROM Menu WHERE id = ${menuId}`, 
            (err) => {
                if (err) {
                    next(err);
                }
                else {
                    res.status(204).send();
                }
            });
        }
    });
});

module.exports = menusRouter;