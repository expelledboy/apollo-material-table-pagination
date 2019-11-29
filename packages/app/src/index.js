import React, { useState } from "react";
import { render } from "react-dom";
import ApolloClient, { gql } from "apollo-boost";
import { ApolloProvider, useQuery } from "@apollo/react-hooks";
import MaterialTable from "material-table";

const client = new ApolloClient({
  uri: "http://localhost:4000/graphql"
});

const PAGE_USERS = gql`
  query($page: Int, $pageSize: Int) {
    users(page: $page, pageSize: $pageSize) {
      total
      data {
        firstName
        lastName
      }
    }
  }
`;

const Users = () => {
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 5
  });

  const { loading, error, data, refetch } = useQuery(PAGE_USERS, {
    variables: pagination
  });

  if (error) return <p>Error: {error.message}</p>;

  const columns = [
    { title: "Name", field: "firstName" },
    { title: "Surname", field: "lastName" }
  ];

  const updatePage = async page => {
    setPagination((data: IPagination) => {
      Object.assign(data, { page });
      return data;
    });
    await refetch({ variables: pagination });
  };

  const updatePageSize = async pageSize => {
    setPagination((data: IPagination) => {
      Object.assign(data, { pageSize });
      return data;
    });
    await refetch({ variables: pagination });
  };

  const props = {
    title: "Users",
    columns,
    data: data ? data.users.data : undefined,
    isLoading: loading,
    onChangePage: updatePage,
    onChangeRowsPerPage: updatePageSize,
    totalCount: data ? data.users.total : undefined,
    ...pagination
  };

  console.log(props);

  return <MaterialTable {...props} />;
};

const App = () => (
  <ApolloProvider client={client}>
    <Users />
  </ApolloProvider>
);

render(<App />, document.getElementById("root"));
