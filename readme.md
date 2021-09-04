# faicha

<!-- vim-markdown-toc GFM -->

- [Why yet another query generator?](#why-yet-another-query-generator)
- [What it looks like ?](#what-it-looks-like-)
- [How to connect to databse?](#how-to-connect-to-databse)
- [Fillers](#fillers)
  - [where](#where)
    - [or / and](#or--and)
  - [select](#select)
  - [values](#values)
    - [Insert single data](#insert-single-data)
  - [set](#set)
  - [limit](#limit)
  - [offset](#offset)

<!-- vim-markdown-toc -->

## Why yet another query generator?

Composing a sql query does not need to be complex.
`faicha` has single abstraction, thats it.

The idea behind `faicha` is to replace dynamic parts of
the queries with functions. While working with `faicha`
we mostly write plain sql statements.

## What it looks like ?

```javascript
import { psql, sql, where } from 'faicha';
// psql for postgres
// sql for mysql

const query = sql`
SELECT * FROM users u
INNER JOIN sessions s ON s.user_id = u.id
${where({ 'u.id': 123, 'u.active': true })}
`;

console.log(query);
//  [
//    'SELECT * FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE u.id = ? AND u.active = ?',
//    [123, true],
//  ];
```

The interesting part here is `where`. Its just a normal function
that gets `placeholder generator` as an argument.

Lets implement a simple form of `where` here. This will give us
an idea of how we can construct the dynamic parts of queries
when we need to.

```javascript
function where(id) {
  return ($) => {
    return `WHERE id = ${$(id)}`;
  };
}

const query = sql`SELECT * FROM users ${where(123)}`;
console.log(query);
// ["SELECT * FROM users WHERE id = ?", [123]]
```

## How to connect to databse?

`faicha` generates parameterized query only.
We need to use a database client to do the actual query.
Lets look at how we can use [pg](https://node-postgres.com) client to do the queries.

```
import { psql, where } from 'faicha'
import { Client } from 'pg'

const client = new Client()
await client.connect()

const query = psql`
SELECT * FROM users
${where({id: 1})};
`
const res = await client.query(...query)
```

## Fillers

We will call these dynamic parts `fillers`.

`faicha` packs some essential `fillers`.

### where

When a map is passed to `where`, it uses `and`.

```javascript
import { sql, where } from 'faicha'

const query = sql`SELECT * FROM users ${where({id: 1 active: true})}`
console.log(query)
// ["SELECT * FROM users WHERE (id = ? AND active = ?)",  [1, true]]
```

#### or / and

For complex logics we can use `and` and `or` fillers.

```javascript
import { sql, where, and, or } from 'faicha'

const query = sql`
SELECT * FROM users
${where(
    and(["id =", 1],
        or(["active =" true], ["city =" "kathmandu"])
    )
  )}
`
console.log(query)
// ["SELECT * FROM users WHERE (id = ? AND (active = ? OR city = ?))", [1, true, "kathmandu"]]
```

### select

### values

`values` can be used to insert data.

#### Insert single data

```javascript
import { sql, values } from 'faicha';

const query = sql`
INSERT INTO users
${values({ email: 'someone@example.com', city: 'kathmandu' })}
`;
console.log(query);
// ["INSERT INTO users (email, city) VALUES (?, ?)", ["someone@example.com", "kathmandu"]]
```

### set

`set` is used for updating table

```javascript
import { sql, set, where } from 'faicha';

const query = sql`
UPDATE users
${set({ email: 'someone@example.com' })}
${where({ id: 1 })}
`;
console.log(query);
// ["UPDATE users SET email = ? WHERE (id = ?)", ["someone@example.com", 1]]
```

### limit

### offset
