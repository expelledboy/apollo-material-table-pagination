import React, { useState, useEffect } from "react";
import { render } from "react-dom";
import ApolloClient, { gql } from "apollo-boost";
import { pick } from "ramda";
import { ApolloProvider, useQuery, useMutation } from "@apollo/react-hooks";
import MaterialTable from "material-table";

const client = new ApolloClient({
  uri: "http://localhost:4000/graphql"
});

const tryCatchOn = (func, when) => (...args) => {
  try {
    return func(...args);
  } catch (e) {
    console.error("ERROR", e);
  }
};

const PAGE_USERS = gql`
  query($pagination: UserPageInput!) {
    users(pagination: $pagination) {
      total
      data {
        id
        firstName
        lastName
      }
    }
  }
`;

const CREATE_USER = gql`
  mutation($user: UserInput!) {
    createUser(user: $user) {
      id
      firstName
      lastName
    }
  }
`;

const UPDATE_USER = gql`
  mutation($id: ID!, $user: UserInput!) {
    updateUser(id: $id, user: $user) {
      id
      firstName
      lastName
    }
  }
`;

const DELETE_USER = gql`
  mutation($id: ID!) {
    deleteUser(id: $id)
  }
`;

const Users = () => {
  const [pagination, setPagination] = useState({
    search: "",
    page: 0,
    pageSize: 5
  });

  const { loading, error, data, refetch } = useQuery(PAGE_USERS, {
    variables: { pagination }
  });

  const refetchQueries = [{ query: PAGE_USERS, variables: { pagination } }];
  const [createUser] = useMutation(CREATE_USER, { refetchQueries });
  const [updateUser] = useMutation(UPDATE_USER, { refetchQueries });
  const [deleteUser] = useMutation(DELETE_USER, { refetchQueries });

  const editable = {
    onRowAdd: tryCatchOn(async user => {
      await createUser({ variables: { user } });
    }, "onRowAdd"),
    onRowUpdate: tryCatchOn(async user => {
      const updates = pick(["firstName", "lastName"], user);
      await updateUser({ variables: { id: user.id, user: updates } });
    }, "onRowUpdate"),
    onRowDelete: tryCatchOn(async user => {
      await deleteUser({ variables: { id: user.id } });
    }, "onRowDelete")
  };

  const columns = [
    { title: "Name", field: "firstName" },
    { title: "Surname", field: "lastName" }
  ];

  const updatePage = async page => {
    setPagination((data: IPagination) => ({ ...data, page }));
  };

  const updatePageSize = async pageSize => {
    setPagination((data: IPagination) => ({ ...data, page: 0, pageSize }));
  };

  const updateSearch = async search => {
    setPagination((data: IPagination) => ({ ...data, page: 0, search }));
  };

  useEffect(() => {
    refetch({ variables: { pagination } });
  }, [pagination, refetch]);

  if (error) return <p>Error: {error.message}</p>;

  // TODO: Find a way to export all across pagination.
  const props = {
    title: "Users",
    columns,
    onChangePage: updatePage,
    onChangeRowsPerPage: updatePageSize,
    onSearchChange: updateSearch,
    isLoading: loading,
    data: data ? data.users.data : undefined,
    totalCount: data ? data.users.total : undefined,
    page: pagination.page,
    editable,
    options: {
      pageSize: pagination.pageSize,
      debounceInterval: 600
    }
  };

  return <MaterialTable {...props} />;
};

const App = () => (
  <ApolloProvider client={client}>
    <Users />
  </ApolloProvider>
);

render(<App />, document.getElementById("root"));
