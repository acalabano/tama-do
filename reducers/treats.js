import database from '../firebase';

// /* -----------------    ACTIONS     ------------------ */

const GET_TREATS = 'GET_TREATS';

// /* ------------   ACTION CREATORS     ------------------ */

const getTreats = treats => ({ type: GET_TREATS, treats });

// /* ------------       REDUCER     ------------------ */

const reducer = (treats = [], action) => {
    switch (action.type) {
        case GET_TREATS:
            return action.treats;
        default:
            return treats;
    }
}

export default reducer;

// /* ------------       DISPATCHERS     ------------------ */

export const fetchTreats = (userId) => dispatch => {
    database.ref(`/users/${userId}/treats`).on('value', snapshot => {
        const obj = snapshot.val();
        const array = [];
        for(let key in obj) {
          obj[key].key = key
          array.push(obj[key]);
        }
        dispatch(getTreats(array));
    });

}

export const removeTreat = (userId, treatId, quantity) => dispatch => {

  if (quantity === 0) {
    database.ref(`/users/${userId}/treats/`).child(treatId).remove();
  } else {
    database.ref().child(`/users/${userId}/treats/${treatId}`)
      .update({ quantity: quantity });
  }

}
