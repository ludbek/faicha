const {render} = require("./index")


const fillers = {
  select($, values) {
    let fields = "*"
    if(values.fields) {
      fields = values.fields.split(",").map(field => $(field)).join(",")
    }
    return `SELECT ${fields}`
  },
  filter($, values) {
    const {name, location} = values
    let conds = []

    if(name) conds.push(`name=${$(name)}`)
    if(location) conds.push(`location=${$(location)}`)
    if(conds.length > 0) {
      return "WHERE " + conds.join(" AND ")
    }
  },
  limit($, values) {
    const {limit} = values
    if(limit) {
      return `LIMIT ${$(limit)}`
    }
  },
  // intensionally left unimplemented to demostrate
  // that unfilled placeholder gets removed
  offset($, values) { }
}

describe("render", () => {
  it("works", () => {
    const queryTemplate = `
    {select} FROM user {filter} {limit} {offset};
    `
    const values = {
      fields: "id,name,location",
      name: "aname",
      location: "alocation",
      limit: 10
    }

    const expectedQuery = `
    SELECT $1,$2,$3 FROM user WHERE name=$4 AND location=$5 LIMIT $6 ;
    `
    const expectedValues = ["id", "name", "location", "aname", "alocation", 10]

    const got = render(queryTemplate, fillers, values)
    expect(got).toEqual([expectedQuery, expectedValues])
  })

  it("is immune to sql injection", () => {
    const queryTemplate = `
    {select} FROM user {filter} {limit} {offset};
    `
    const values = {
      fields: "id,name,location",
      // attack
      name: "; DROP TABLE user;",
      location: "alocation",
      limit: 10
    }

    // sql inject is not included in the parameterized query
    const expectedQuery = `
    SELECT $1,$2,$3 FROM user WHERE name=$4 AND location=$5 LIMIT $6 ;
    `
    // its in the values
    const expectedValues = ["id", "name", "location", "; DROP TABLE user;", "alocation", 10]

    const got = render(queryTemplate, fillers, values)
    expect(got).toEqual([expectedQuery, expectedValues])
  })
})