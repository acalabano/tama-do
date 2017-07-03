import React, { Component } from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { connect } from 'react-redux';
import { StackNavigator } from 'react-navigation'
import AddTask from './AddTask'
import store from '../store'
import Checkbox from './common/checkbox'
import database from '../firebase'
import Swipeout from 'react-native-swipeout'




class ToDo extends Component {
  constructor(props) {
    super(props)
    this.state = {
      tasks: {}
    }
    this.onChange = this.onChange.bind(this)
    this.updateQuantity = this.updateQuantity.bind(this)
  }


  componentDidMount() {
    let unsubscribe = store.subscribe(() => {
      this.setState(store.getState())
    })
  }

  makeFlatlist = (completed = 'completed') => {
    return (

      <FlatList
        data={this.state.tasks[completed]}
        removeClippedSubviews={false}
        keyExtractor={this._keyExtractor}
        renderItem={({ item }) => {
          return (
            <Swipeout right={this.makeSwipeButtons(item)}>
              <View style={styles.listItem}>
                <Checkbox
                  label={item.name}
                  onChange={() => {
                    this.onChange(this.state.auth.user, item.key, item[completed])
                  }}
                  checked={item.completed}
                />
              </View>
            </Swipeout>

          )
        }}

      />

    )
  }

  makeSwipeButtons = (item) => {
    var taskRef = database.ref(`/users/${this.state.auth.user}/tasks/${item.key}`)
    return [{
      text: 'Delete',
      backgroundColor: 'red',
      underlayColor: 'rgba(0, 0, 0, 1, 0.6)',
      onPress: () => {taskRef.remove() }
    }];
  }

  getTreatType() { // figure out whether this is working 
    min = 0;
    max = 3;
    randInt = Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    switch (randInt) {
      case 0: return 'cherry'
      case 1: return 'donut'
      case 2: return 'candy'
      default: return null
    }
  }
  //
  addTreat(treatsRef, taskRef) {
    // check for treatType on task
    taskRef.once('value').then((snapshot) => {
      return snapshot.val().treat
    })
      .then(treatType => {
        //what if task does not yet have a treatType associated?
        if (!treatType) {
          treatType = this.getTreatType()
          // update task to have treat type
          taskRef.update({ treat: treatType })
        }
        return treatType
      })
      .then(treatType => {
        var query = treatsRef.orderByChild("type").equalTo(treatType)

        //what if query returns nothing because treatType does not exist on treats?
        query.once('value', (snapshot) => {
          if (!snapshot.val()) {
            //create treat
            var newTreatRef = treatsRef.push()
            newTreatRef.set({
              type: treatType,
              quantity: 0
            })
              .then(() => { this.updateQuantity(query) })
          } else {
            this.updateQuantity(query)
          }
        })
      })
  }

  subtractTreat(treatsRef, taskRef) {
    taskRef.once('value').then((snapshot) => {
      return snapshot.val().treat
    })
      .then((treatType) => {
        var query = treatsRef.orderByChild("type").equalTo(treatType)
        this.updateQuantity(query, 'decrement')
      })

  }

  updateQuantity(query, direction = 'increment') {
    var quant
    query.once('value', function (snapshot) {
      var snapArr = []
      if (!Array.isArray(snapshot.val())) {
        for (var key in snapshot.val()) {
          snapArr.push(snapshot.val()[key])
        }
      } else {
        snapArr = snapshot.val()
      }
      snapArr = snapArr.filter(child => child)
      quant = snapArr[0].quantity
    })
    query.once('child_added', function (snapshot) {
      if (direction == 'increment') {
        quant = (Number(quant) + 1)
      } else {
        quant = (Number(quant) - 1)
      }
      snapshot.ref.update({ quantity: quant })
    })
  }

  onChange(userId, taskId, completed) {
    var taskUpdates = {}
    var treatsRef = database.ref(`/users/${this.state.auth.user}`).child('treats')
    var taskRef = database.ref(`/users/${this.state.auth.user}/tasks/${taskId}`)

    if (completed) {
      taskUpdates = { completed: false }
      this.subtractTreat(treatsRef, taskRef)
    } else {
      taskUpdates = { completed: true }
      this.addTreat(treatsRef, taskRef)
    }
    database.ref(`/users/${userId}/tasks/${taskId}`).update(taskUpdates)
  }

  _keyExtractor = (item) => item.key

  render() {
    const { navigate } = this.props.navigation;
    return (
      <View style={styles.container}>
        {this.makeFlatlist('uncompleted')}
        {this.makeFlatlist('completed')}
        <AddTask />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItem: {

    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});


const mapState = ({ tasks, auth }) => ({ tasks, auth })

const mapDispatch = {}



export const TaskNavigator = StackNavigator({
  ToDo: { screen: ToDo },
  AddTask: { screen: AddTask }
})

export default connect(mapState, mapDispatch)(ToDo)