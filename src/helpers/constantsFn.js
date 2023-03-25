const upperCaseFirstLetter = (str) => {
    let firstLetter = str.substr(0, 1);
    return firstLetter.toUpperCase() + str.substr(1);
  }
const lowerCaseFirstLetter = (str) => {
    let firstLetter = str.substr(0, 1);
    return firstLetter.toLowerCase() + str.substr(1);
  }

const errorFn = (error) => new Error(error);
const paramFn = (p) => p;

const schemaMock = (type) =>  `

schema {
  query: Query
}

directive @key(fields: _FieldSet!, resolvable: Boolean = true) repeatable on OBJECT | INTERFACE

directive @requires(fields: _FieldSet!) on FIELD_DEFINITION

directive @provides(fields: _FieldSet!) on FIELD_DEFINITION

directive @extends on OBJECT | INTERFACE

directive @external(reason: String) on OBJECT | FIELD_DEFINITION

directive @tag(name: String!) repeatable on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION



interface Node {
  id: ID!
}

scalar Date

scalar _Any

scalar _FieldSet

type ${upperCaseFirstLetter(type)} {
  id: ID
  clearID: String
  sourceSystem: String
  loadDate: Date
  updateDate: Date
  code: String
}

union _Entity = ${upperCaseFirstLetter(type)}



type _Service {
  sdl: String
}

type PageInfo {
  hasNextPage: Boolean
  hasPreviousPage: Boolean
  startCursor: String
  endCursor: String
}



type ${upperCaseFirstLetter(type)}Edge {
  node: ${upperCaseFirstLetter(type)}
  cursor: String
}

type ${upperCaseFirstLetter(type)}Connection {
  pageInfo: PageInfo
  edges: [${upperCaseFirstLetter(type)}Edge]
  total: Int
}

type Query {
  ${type.toLowerCase()}(first: Int, after: String, loadDate: String, updateDate: String, sourceSystem: String): ${upperCaseFirstLetter(type)}Connection
  _entities(representations: [_Any!]!): [_Entity]!
  _service: _Service!
}


`;

const typeDefsMock = (type) =>  `

schema {
  query: Query
}


scalar Date

type ${upperCaseFirstLetter(type)} {
  id: ID
  clearID: String
  sourceSystem: String
  loadDate: Date
  updateDate: Date
  code: String
}

type PageInfo {
  hasNextPage: Boolean
  hasPreviousPage: Boolean
  startCursor: String
  endCursor: String
}


type ${upperCaseFirstLetter(type)}Edge {
  node: ${upperCaseFirstLetter(type)}
  cursor: String
}

type ${upperCaseFirstLetter(type)}Connection {
  pageInfo: PageInfo
  edges: [${upperCaseFirstLetter(type)}Edge]
  total: Int
}

type Query {
  ${type.toLowerCase()}(first: Int, after: String, loadDate: String, updateDate: String, sourceSystem: String): ${upperCaseFirstLetter(type)}Connection
}


`;

module.exports = {
    errorFn,
    paramFn,
    upperCaseFirstLetter,
    lowerCaseFirstLetter,
    schemaMock,
    typeDefsMock
};