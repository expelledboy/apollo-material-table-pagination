const express = require("express");
const proxy = require("express-http-proxy");
const casual = require("casual");
const { ApolloServer, gql } = require("apollo-server-express");

const typeDefs = gql`
  input UserInput {
    firstName: String!
    lastName: String!
  }

  type User {
    id: ID!
    firstName: String!
    lastName: String!
  }

  input UserPageInput {
    page: Int
    pageSize: Int
    search: String
    orderBy: String
  }

  type UserPage {
    total: Int!
    data: [User]!
  }

  type Query {
    users(pagination: UserPageInput!): UserPage!
  }

  type Mutation {
    createUser(user: UserInput!): User!
    updateUser(id: ID!, user: UserInput!): User!
    deleteUser(id: ID!): Boolean!
  }
`;

let users = [...Array(23)].map(() => ({
  id: casual.uuid,
  firstName: casual.first_name,
  lastName: casual.last_name
}));

const resolvers = {
  Query: {
    users: async (root, args, cxt) => {
      console.log("users", args);
      const { page, pageSize, search } = args.pagination;
      let start = (page + 1) * pageSize - pageSize;
      let end = (page + 1) * pageSize;
      const subset = users.filter(user => {
        if (search == "") return true;
        const name = `${user.firstName} ${user.lastName}`.toLowerCase();
        return !!name.match(search.toLowerCase());
      });
      // console.log(subset);
      return {
        total: subset.length,
        data: subset.slice(start, end)
      };
    }
  },
  Mutation: {
    createUser: async (root, args, cxt) => {
      console.log("createUser", args);
      const idx = users.findIndex(user => user.id === args.user.id);
      if (idx >= 0) throw new Error("user already exists");
      const user = Object.assign({ id: casual.uuid }, args.user);
      users.push(user);
      return user;
    },
    updateUser: async (root, args, cxt) => {
      console.log("updateUser", args);
      const idx = users.findIndex(user => user.id === args.id);
      if (idx < 0) throw new Error("user not found");
      return Object.assign(users[idx], args.user);
    },
    deleteUser: async (root, args, cxt) => {
      console.log("deleteUser", args);
      users = users.filter(user => user.id !== args.id);
      return true;
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

const app = express();

server.applyMiddleware({ app });

app.use("/", proxy("http://localhost:3000"));

const port = 4000;

app.listen({ port }, () =>
  console.log(
    `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
  )
);
