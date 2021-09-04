# faicha

## Why yet another query generator?

Composing a sql query does not need to be complex.
`faicha` has single abstraction, thats it.

The idea behind `faicha` is to replace dynamic parts of
the queries with functions. While working with `faicha`
we mostly write plain sql statements.

## An example of using `faicha`

```javascript
import { psql, sql, where } from 'faicha';
// psql for postgres
// sql for mysql

const query = sql`
SELECT * FROM users
INNER JOIN sessions ON sessions.user_id = users.id
${where({ 'users.id =': 123, 'users.active =': true })}
`;

console.log(query);
//  [
//    'SELECT * FROM users INNER JOIN sessions ON sessions.user_id = users.id WHERE users.id = ? AND users.active = ?',
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

## Fillers

<!-- vim-markdown-toc GFM -->

- [where](#where)
  - [or / and](#or--and)
- [select](#select)
- [values](#values)
  - [Insert single data](#insert-single-data)
- [set](#set)
- [limit](#limit)
- [offset](#offset)

<!-- vim-markdown-toc -->

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
