const express = require('express');
const itemsRouter = express.Router(
    {
        mergeParams: true
    }
);

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const pp = x => JSON.stringify(x, null, 2);

itemsRouter.get('/', (req, res, next) => {
    const menuId = req.params.menuId;
    db.all(`SELECT * FROM MenuItem WHERE menu_id = ${menuId}`, 
    (err, rows) => {
        if (err) {
            res.status(404).send();
        }
        else {
            res.status(200).send({ menuItems: rows });
        }
    });
});

itemsRouter.post('/', (req, res, next) => {
    const menuId = req.params.menuId;
    const menuItem = req.body.menuItem;
    const name = menuItem.name;
    const description = menuItem.description;
    const inventory = menuItem.inventory;
    const price = menuItem.price;

    // console.log(`>>>>>>>> ${pp(menuItem)}`);

    db.get(`SELECT * FROM Menu WHERE id = ${menuId}`,
    (err, row) => {
        if (err) {
            res.status(404).send();
        }
        else {
            if (!name || !inventory || !price || !row) {
                return res.status(400).send();
            }
        }
    });

    db.run(`INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuId)`,
    {
        $name: name,
        $description: description,
        $inventory: inventory,
        $price: price,
        $menuId: menuId
    },
    function (err) {
        if (err) {
            next(err);
        }
        else {
            db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`,
            (err, row) => {
                if (err) {
                    next(err);
                }
                else {
                    res.status(201).send({ menuItem: row });
                }
            });
        }
    });
});

itemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
    db.get(`SELECT * FROM MenuItem WHERE id = ${menuItemId}`,
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
    });
});

itemsRouter.put('/:menuItemId', (req, res, next) => {
    const itemId = req.params.menuItemId;
    const menuId = req.params.menuId;
    const menuItem = req.body.menuItem;
    const name = menuItem.name;
    const description = menuItem.description || '';
    const inventory = menuItem.inventory;
    const price = menuItem.price;

    db.get(`SELECT * FROM Menu WHERE id = ${menuId}`,
    (err, row) => {
        if (err) {
            res.status(404).send();
        }
        else {
            if (!name || !inventory || !price || !row) {
                return res.status(400).send();
            }
        }
    });

    db.run(`UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price WHERE id = $id`,
    {
        $name: name,
        $description: description,
        $inventory: inventory,
        $price: price,
        $id: itemId
    },
    function (err) {
        if (err) {
            next(err);
        }
        else {
            db.get(`SELECT * FROM MenuItem WHERE id = $id`,
            {
                $id: itemId
            },
            (err, row) => {
                if (err) {
                    res.status(400).send();
                }
                else {
                    res.status(200).send({ menuItem: row });
                }
            });
        }
    });
});

itemsRouter.delete('/:menuItemId', (req, res, next) => {
    const itemId = req.params.menuItemId;
    
    db.run(`DELETE FROM MenuItem WHERE id = ${itemId}`,
        (err) => {
            if (err) {
                next(err);
            }
            else {
                res.status(204).send();
            }
    });
});

module.exports = itemsRouter;