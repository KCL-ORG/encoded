import { ADD_TO_CART, REMOVE_FROM_CART } from './actions';
import CartControl from './cart_control';
import CartStatus from './cart_status';


/**
 * Redux reducer function for the cart module.
 *
 * @param {object} state - Redux store state
 * @param {object} action - Action to perform on the cart store
 */
const cartModule = (state = {}, action = {}) => {
    switch (action.type) {
    case ADD_TO_CART:
        return { cart: state.cart.concat([action.currentUuid]) };
    case REMOVE_FROM_CART: {
        const doomedIndex = state.cart.indexOf(action.currentUuid);
        if (doomedIndex !== -1) {
            return {
                cart: state.cart
                    .slice(0, doomedIndex)
                    .concat(state.cart.slice(doomedIndex + 1)),
            };
        }
        return state;
    }
    default:
        return state;
    }
};


export { CartControl, CartStatus, cartModule };
