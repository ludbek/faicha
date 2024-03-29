import {
  placeholderGenerator,
  where,
  sql,
  psql,
  limit,
  offset,
  and,
  or,
  values,
  select,
  set,
} from './index';

describe('placeholderGenerator.gen', () => {
  it('should return placeholder', () => {
    const $ = placeholderGenerator('$');
    expect($.gen('a')).toEqual('$1');
    expect($.gen('b')).toEqual('$2');
  });
});

describe('placeholderGenerator.getValues', () => {
  it('should return values', () => {
    const $ = placeholderGenerator('$');
    $.gen('a');
    $.gen('b');

    expect($.getValues()).toEqual(['a', 'b']);
  });
});

describe('where', () => {
  it('works', () => {
    const $ = placeholderGenerator('$');
    const params = {
      name: 'aname',
      id: ['aid', 'bid'],
      date: undefined,
    };
    const got = where(
      and(
        ['name =', params.name],
        or(['id IN', params.id], "address = 'somewhere'"),
        ['date =', params.date],
        () => {
          return "category like 'hoooman'";
        },
      ),
    )($.gen);
    const expected =
      "WHERE ( name = $1 AND ( id IN ( $2, $3 ) OR address = 'somewhere' ) AND category like 'hoooman' )";
    expect(got).toEqual(expected);
    expect($.getValues()).toEqual(['aname', 'aid', 'bid']);
  });

  it('implicitly sets and()', () => {
    const params = {
      name: 'aname',
      age: '1',
    };
    const $ = placeholderGenerator('$');
    const got = where(['name =', params.name], ['age =', params.age])($.gen);
    const expected = 'WHERE ( name = $1 AND age = $2 )';
    expect(got).toEqual(expected);
    expect($.getValues()).toEqual(['aname', '1']);
  });

  it('implicitly sets and() if query is an object ', () => {
    const params = {
      name: 'aname',
      age: '1',
    };
    const $ = placeholderGenerator('$');
    const got = where(params)($.gen);
    const expected = 'WHERE ( name = $1 AND age = $2 )';
    expect(got).toEqual(expected);
    expect($.getValues()).toEqual(['aname', '1']);
  });
});

describe('sql', () => {
  it('works', () => {
    const params = {
      id: 1,
      name: 'apple',
      limit: 10,
      offset: 20,
    };
    const result = sql`
    SELECT * FROM users
    ${where(
      and(
        ['id =', params.id],
        ['name like', params.name],
        ['location =', undefined],
      ),
    )}
    ${limit(params.limit)}
    ${offset(params.offset)};
    `;

    const expectedSql = `
    SELECT * FROM users
    WHERE ( id = ? AND name like ? )
    LIMIT ?
    OFFSET ?;
    `;
    const expected = [expectedSql, [1, 'apple', 10, 20]];
    expect(result).toEqual(expected);
  });
});

describe('psql', () => {
  it('works', () => {
    const params = {
      id: 1,
      name: 'apple',
      limit: 10,
      offset: 20,
    };
    const result = psql`
    SELECT * FROM users
    ${where(
      and(
        ['id =', params.id],
        ['name like', params.name],
        ['location =', undefined],
      ),
    )}
    ${limit(params.limit)}
    ${offset(params.offset)};
    `;

    const expectedSql = `
    SELECT * FROM users
    WHERE ( id = $1 AND name like $2 )
    LIMIT $3
    OFFSET $4;
    `;
    const expected = [expectedSql, [1, 'apple', 10, 20]];
    expect(result).toEqual(expected);
  });
});

describe('limit', () => {
  it('works', () => {
    const $ = placeholderGenerator('?');
    const params = {
      limit: 10,
    };
    const expected = 'LIMIT ?';
    const got = limit(params.limit)($.gen);
    expect(got).toEqual(expected);
    expect($.getValues()).toEqual([params.limit]);
  });

  it('returns empty string if falsy value is passed', () => {
    const $ = placeholderGenerator('?');
    const expected = '';

    const got1 = limit(undefined)($.gen);
    expect(got1).toEqual('');

    const got2 = limit(null)($.gen);
    expect(got2).toEqual('');

    const got3 = limit(0)($.gen);
    expect(got3).toEqual('');

    const got4 = limit(false)($.gen);
    expect(got4).toEqual('');
  });
});

describe('offset', () => {
  it('works', () => {
    const $ = placeholderGenerator('?');
    const params = {
      offset: 50,
    };
    const expected = 'OFFSET ?';
    const got = offset(params.offset)($.gen);
    expect(got).toEqual(expected);
    expect($.getValues()).toEqual([params.offset]);
  });

  it('returns empty string if falsy value is passed', () => {
    const $ = placeholderGenerator();

    const got1 = offset(undefined)($.gen);
    expect(got1).toEqual('');

    const got2 = offset(null)($.gen);
    expect(got2).toEqual('');

    const got3 = offset(0)($.gen);
    expect(got3).toEqual('');

    const got4 = offset(false)($.gen);
    expect(got4).toEqual('');
  });
});

describe('values', () => {
  it('works', () => {
    const $ = placeholderGenerator('$');
    const data = {
      name: 'a name',
      address: 'an address',
    };
    const expectedPartialQuery = `(name, address) VALUES ($1, $2)`;
    expect(values(data)($.gen)).toEqual(expectedPartialQuery);
    expect($.getValues()).toEqual([data.name, data.address]);
  });
});

describe('select', () => {
  it('works', () => {
    const generator = placeholderGenerator('$');
    const expectedPartialQuery = `SELECT $1, $2`;
    expect(select(['name', 'address'])(generator.gen)).toEqual(
      expectedPartialQuery,
    );
  });
});

describe('set', () => {
  it('works', () => {
    const generator = placeholderGenerator('$');
    const expectedPartialQuery = `SET name = $1, address = $2`;
    const values = {
      name: 'a name',
      address: 'an address',
    };
    expect(set(values)(generator.gen)).toEqual(expectedPartialQuery);
    expect(generator.getValues()).toEqual([values.name, values.address]);
  });
});
