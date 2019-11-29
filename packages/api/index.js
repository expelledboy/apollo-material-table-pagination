const express = require("express");
const proxy = require("express-http-proxy");
const casual = require("casual");
const { ApolloServer, gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    firstName: String
    lastName: String
  }

  type UserPage {
    total: Int
    data: [User]!
  }

  type Query {
    users(page: Int, pageSize: Int): UserPage!
  }
`;

const users = [...Array(23)].map(() => ({
  id: casual.uuid,
  firstName: casual.first_name,
  lastName: casual.last_name
}));

const resolvers = {
  Query: {
    users: async (root, args, cxt) => {
      console.log("GET: users", args);

      const { page, pageSize } = args;

      let start = (page + 1) * pageSize - pageSize;
      let end = (page + 1) * pageSize;

      return {
        total: users.length,
        data: users.slice(start, end)
      };
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
