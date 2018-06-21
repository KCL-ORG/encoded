// This file lets other files import this directory to get the cart reducer function and any cart-
// related rendering components.
//
// You'll see references to various kinds of related carts:
//
// active - The in-memory representation of the cart held in a Redux store
// shared - The cart in a user's `carts` object referenced by "/carts/<uuid>"
// saved - The cart contents in a user's `carts` object
// user - The user's `carts` object
//
// "active" carts hold both saved and unsaved items. "shared" carts hold saved items. Users who
// aren't logged in can only have an "active" cart. "shared" carts, when displayed with the cart's
// uuid, can be shared with others.
import { createStore } from 'redux';
import _ from 'underscore';
import {
    ADD_TO_CART,
    ADD_MULTIPLE_TO_CART,
    REMOVE_FROM_CART,
    REMOVE_MULTIPLE_FROM_CART,
    CACHE_SAVED_CART,
} from './actions';
import CartAddAll from './add_multiple';
import cartCacheSaved from './cache_saved';
import CartControl, { cartAddItems } from './control';
import CartOverlay from './overlay';
import CartRemoveAll from './remove_multiple';
import { saveCart } from './save';
import CartSearchControls from './search_controls';
import CartShare from './share';
import CartStatus from './status';
import CartToggle from './toggle';


/**
 * Redux reducer function for the cart module.
 *
 * @param {object} state - Redux store state
 * @param {object} action - Action to perform on the cart store
 */
const cartModule = (state = {}, action = {}) => {
    switch (action.type) {
    case ADD_TO_CART:
        return Object.assign({}, state, {
            cart: state.cart.concat([action.current]),
        });
    case ADD_MULTIPLE_TO_CART: {
        // Merge the current cart contents with the incoming items while deduping them.
        const items = [...new Set([...state.cart, ...action.items])];
        return Object.assign({}, state, {
            cart: items,
        });
    }
    case REMOVE_FROM_CART: {
        const doomedIndex = state.cart.indexOf(action.current);
        if (doomedIndex !== -1) {
            return Object.assign({}, state, {
                cart: state.cart
                    .slice(0, doomedIndex)
                    .concat(state.cart.slice(doomedIndex + 1)),
            });
        }
        return state;
    }
    case REMOVE_MULTIPLE_FROM_CART:
        return Object.assign({}, state, {
            cart: _.difference(state.cart, action.items),
        });
    case CACHE_SAVED_CART:
        return Object.assign({}, state, {
            savedCartObj: action.cartObj,
        });
    default:
        return state;
    }
};


// Once the contents of the cart Redux store changes, save those changes to the database for
// logged-in users.
//
// This mechanism for tracking the current and next state of the store is highly reliant on a
// closure, but this is the mechanism recommended by Dan Abramov for exactly this situation.
// https://github.com/reduxjs/redux/issues/303#issuecomment-125184409
const cartObserveChanges = (store, user, fetch) => {
    let currState = {};

    const handleChange = () => {
        const nextState = store.getState();
        const nextCart = nextState.cart || [];
        const currCart = currState.cart || [];
        if (nextCart.length !== currCart.length || !_.isEqual(nextCart, currCart)) {
            currState = Object.assign({}, nextState);
            saveCart(currState.cart, currState.savedCartObj, user, fetch).then((updatedSavedCartObj) => {
                cartCacheSaved(updatedSavedCartObj, store.dispatch);
            });
        }
    };

    return store.subscribe(handleChange);
};


const initializeCart = () => {
    const initialCart = {
        cart: [], // Active cart contents as array of @ids
        name: 'Untitled',
        savedCartObj: {}, // Cache of saved cart
    };
    const cartStore = createStore(cartModule, initialCart);
    return cartStore;
};


export {
    CartAddAll,
    CartRemoveAll,
    cartCacheSaved,
    CartControl,
    CartSearchControls,
    CartStatus,
    CartToggle,
    cartAddItems,
    CartShare,
    CartOverlay,
    cartObserveChanges,
    cartModule, // Exported for Jest tests
    initializeCart as default,
};
