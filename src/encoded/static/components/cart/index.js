// This file lets other files import this directory to get the cart reducer function and any cart-
// related rendering components.
import { ADD_TO_CART, ADD_MULTIPLE_TO_CART, REMOVE_FROM_CART } from './actions';
import CartControl, { cartAddItems } from './cart_control';
import CartToggle from './cart_toggle';
import CartStatus from './cart_status';
import CartAddMultiple from './cart_add_multiple';


/**
 * Redux reducer function for the cart module.
 *
 * @param {object} state - Redux store state
 * @param {object} action - Action to perform on the cart store
 */
const cartModule = (state = {}, action = {}) => {
    switch (action.type) {
    case ADD_TO_CART:
        return { cart: state.cart.concat([action.current]) };
    case ADD_MULTIPLE_TO_CART: {
        const items = [...new Set([...state.cart, ...action.items])];
        return { cart: state.cart.concat(items) };
    }
    case REMOVE_FROM_CART: {
        const doomedIndex = state.cart.indexOf(action.current);
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


export {
    CartAddMultiple,
    CartControl,
    CartStatus,
    CartToggle,
    cartAddItems,
    cartModule as default,
};
