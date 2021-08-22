## faicha
It empowers one to write complex and safe sql queries.

## Problems it solves
- static sql queries do not scale
- its hard to express complex db queries using ORM and query builders

## Installation
`yarn add faicha`

or

`npm install --save faicha`

## Concepts
In complex queries, majority of it are static only some portions are dynamic.
For an example, imagine a reporting query which joins multiple tables, includes
subqueries and allows filter. In that query most of the time filter will be the only dynamic part.

While working with `faicha` we do not need to learn new DSL.
We will mostly be writing low level native queries and
few functions to fill the dynamic parts.

## Fillers
Right now there are only 3 fillers bundled with `faicha`. Its really easy to write new filler which we will see [later]().

### 1. where
#### and
#### or
### 2. limit 
### 3. offset
## Custom filler

## SQL Walkthrough
```javascript
const {sql, where, and, or, limit} = require("faicha")

const queryParams = {
  search: "lal",
  location: "sydney",
  page: 2,
  limit: 50
}

// faicha makes use of tagged template
// visit https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates
// prepare query template
const query = sql`
SELECT * FROM user

${where(
  or(
    ["name ilike", queryParams.search],
    and(
      ["location =", queryParams.location],
      ["password =", undefined],
      "active = TRUE"
    )
  )
)}

${limit(queryParams.limit)}

${genPlaceholder => {
  // this is a custom filler for offset
  // this is how where and limit works internally
  const { page, limit } = queryParams
  if(page) {
    const offset = (page - 1) * limit
    return `OFFSET ${genPlaceholder(offset)}`
  }
  return ''
}}
;
`

console.log(query[0])
>>
>> SELECT * FROM user
>>
>> WHERE ( name ilike ? OR ( location = ? AND active = TRUE ) )
>>
>> LIMIT ?
>>
>> OFFSET ?
>> ;

console.log(query[1])
>> ["lal", "sydney", 50, 50]


// query the db
await client.query(...query)

```

## Postgres Walkthrough
```javascript
const {psql, where, and, or, limit} = require("faicha")

const queryParams = {
  search: "lal",
  location: "sydney",
  page: 2,
  limit: 50
}

// faicha makes use of tagged template
// visit https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates
// prepare query template
const query = psql`
SELECT * FROM user

${where(
  or(
    ["name ilike", queryParams.search],
    and(
      ["location =", queryParams.location],
      ["password =", undefined],
      "active = TRUE"
    )
  )
)}

${limit(queryParams.limit)}

${genPlaceholder => {
  // this is a custom filler for offset
  // this is how where and limit works internally
  const { page, limit } = queryParams
  if(page) {
    const offset = (page - 1) * limit
    return `OFFSET ${genPlaceholder(offset)}`
  }
  return ''
}}
;
`

console.log(query[0])
>>
>> SELECT * FROM user
>>
>> WHERE ( name ilike $1 OR ( location = $2 AND active = TRUE ) )
>>
>> LIMIT $3
>>
>> OFFSET $4
>> ;

console.log(query[1])
>> ["lal", "sydney", 50, 50]


// query the db
await client.query(...query)

```
