import React from 'react';
import PropTypes from 'prop-types';
import * as globals from './globals';


/* REDUX ACTION CREATORS */
const ADD_TO_CART = 'ADD_TO_CART';
const REMOVE_FROM_CART = 'REMOVE_FROM_CART';

export const addToCart = id => (
    { type: ADD_TO_CART, id }
);

export const removeFromCart = (id) => (
    { type: REMOVE_FROM_CART, id }
);


/* REDUX REDUCERS */
export const cartReducer = (state = {}, action = {}) => {
    switch (action.type) {
    case ADD_TO_CART:
        if (!state.cart) {
            return { cart: [action.id] };
        }
        return { cart: state.cart.concat([action.id]) };
    case REMOVE_FROM_CART: {
        const doomedIndex = state.cart.indexOf(action.id);
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


/**
 * Update the cart object in the DB. You must provide `cartAtId` because `cart` cannot have non-
 * writeable properties in it, and @id is one of several non-writeable properites. You normally
 * get an object with no non-writeable properties by doing a GET request on that object with
 * "frame=edit" in the query string.
 *
 * @param {object} cart - cart object to update; must be editable version (no @id etc)
 * @param {string} cartAtId - @id of the cart object to update
 * @param {func} fetch - fetch function to use
 * @return (object) - Promise containing PUT response that resolves when GET request completes
 */
const updateCart = (cart, cartAtId, fetch) => (
    fetch(cartAtId, {
        method: 'PUT',
        body: JSON.stringify(cart),
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    }).then((response) => {
        if (!response.ok) {
            throw response;
        }
        return response.json();
    }).catch(globals.parseAndLogError.bind('Update cart', 'putRequest'));
);


/**
 * Get a writeable version of the cart object specified by `cartAtId`.
 *
 * @param {string} cartAtId - @id of the cart object to retrieve
 * @param {func} fetch - fetch function to use
 * @return {object} - Promise containing the retrieved cart object, or an error response
 */
const getWriteableCart = (cartAtId, fetch) => (
    fetch(`${cartAtId}?frame=edit`, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    }).then((response) => {
        if (!response.ok) {
            throw response;
        }
        return response.json();
    }).catch(globals.parseAndLogError.bind('Get writeable cart', 'putRequest'))
);


// Button to add the current experiment to the cart.
const AddToCartComponent = ({ onAddToCartClick }) => (
    <button onClick={onAddToCartClick}>Add to Cart</button>
);

AddToCartComponent.propTypes = {
    onAddToCartClick: PropTypes.func, //  Function to call when Add to Cart clicked
};

AddToCartComponent.defaultProps = {
    onAddToCartClick: null,
};

// AddToCartComponent component doesn't need mapStateToProps because it doesn't use any state from
// the Redux store.

const mapDispatchToProps = (dispatch, ownProps) => (
    { onAddToCartClick: () => dispatch(addToCart(ownProps.currentExperiment)) }
);

const AddToCart = connect(null, mapDispatchToProps)(AddToCartComponent);


// Render the Add to Cart button and react to clicks in it by updating the current cart object
// to include the UUID of the object given in `objToAdd`.
const CartAddRenderer = ({ objToAdd, inCart, onAddToCartClick }) => (
    <button onClick={onAddToCartClick} disabled={inCart}>{inCart ? 'In cart' : 'Add to cart'}</button>
);

CartAddRenderer.propTypes = {
    objToAdd: PropTypes.object, // encodeD object to add to cart
    inCart: PropTypes.bool, // True if the object this button is for is already in the cart
    onAddToCartClick: PropTypes.func, // Function to call when Add to Cart button is clicked
};

const mapDispatchToProps = (dispatch, ownProps) => (
    { onAddToCartClick: () => dispatch(addToCart(ownProps.objToAdd)) }
);

const AddToCart = connect(null, mapDispatchToProps)(AddToCartComponent);


export default CartAdd;
