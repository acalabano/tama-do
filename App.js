import React, { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { connect, Provider } from 'react-redux';
import { fetchTasks, getTasks } from './reducers/tasks';
import { fetchPets, getPets } from './reducers/pets';

import database from './firebase';
import { Tabs } from './Tabs';
import LoginNavigator from './components/LoginForm';
import store from './store';
import { auth } from './firebase';
import {setUser} from './reducers/login';
import { fetchTreats } from './reducers/treats';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null
    }
  }


  componentDidMount() {
    auth.onAuthStateChanged(user => {
      if (user) {
        // User is signed in.
        store.dispatch(fetchTasks(user.uid))
        store.dispatch(fetchPets(user.uid))
        store.dispatch(setUser({user: user.uid}))
        store.dispatch(fetchTreats(user.uid));

        this.setState({ user });
      } else {
        // No user is signed in.
        this.setState({ user: null })
      }
    });
  }

  render() {
    if (this.state.user) {
      return (
        <Provider store={store}>
            <Tabs />
        </Provider>
      )
    }
    return (
      <Provider store={store}>
        <LoginNavigator />
      </Provider>
    );
  }
}

