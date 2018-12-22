function placeholderGenerator(symbol = '') {
  let queryValues = []

  return {
    gen(value) {
      queryValues.push(value)
      if(symbol === '$') {
        return `$${queryValues.length}`
      }
      return `?`
    },
    getValues() {
      return queryValues
    }
  }
}

// for tagged template see
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
function render(args, generator) {
  let fillers = Array.from(args)
  fillers.shift()
  let result = [args[0][0]]
  fillers.forEach((filler, index) => {
    result.push(filler(generator.gen), args[0][index + 1])
  })

  return [result.join(''), generator.getValues()]
}

function sql(strings) {
  const args = Array.from(arguments)
  const generator = placeholderGenerator('?')
  return render(args, generator)
}

function psql(strings) {
  const args = Array.from(arguments)
  const generator = placeholderGenerator('$')
  return render(args, generator)
}

function q($, unit) {
  if(typeof unit === 'string') {
    return unit
  }
  else if(Array.isArray(unit)) {
    let value = unit[1]
    if(value !== undefined) {
      if(Array.isArray(value)) {
        return [unit[0], `( ${value.map(avalue => $(avalue)).join(', ')} )`].join(' ')
      }
      else {
        return [unit[0], $(value)].join(' ')
      }
    }
    return undefined
  }
  else if (typeof unit === 'function') {
    return unit($)
  }
}

function and() {
  const args = Array.from(arguments)
  return ($) => {
    const query = args
      .map(item => {
        return q($, item)
      })
      .filter(item => !!item)
      .join(' AND ')

    if(query) {
      return `( ${query} )`
    }
  }
}

function or() {
  const args = Array.from(arguments)
  return ($) => {
    const query = args
      .map(item => {
        return q($, item)
      })
      .filter(item => !!item)
      .join(' OR ')

    if(query) {
      return `( ${query} )`
    }
  }
}

function where(orAnd) {
  return ($) => {
    const partialQuery = orAnd($)
    if (partialQuery) {
      return 'WHERE ' + partialQuery
    }
    return ''
  }
}

function limit(value) {
  return function ($) {
    if(value) {
      return `LIMIT ${$(value)}`
    }
    return ''
  }
}

function offset(value) {
  return function ($) {
    if(value) {
      return `OFFSET ${$(value)}`
    }
    return ''
  }
}

module.exports = {
  placeholderGenerator,
  sql,
  psql,
  where,
  limit,
  offset,
  and,
  or
}
