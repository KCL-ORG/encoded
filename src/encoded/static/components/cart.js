import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as globals from './globals';


/* REDUX ACTION CREATORS */
const ADD_TO_CART = 'ADD_TO_CART';
const REMOVE_FROM_CART = 'REMOVE_FROM_CART';

export const addToCart = currentUuid => (
    { type: ADD_TO_CART, currentUuid }
);

export const removeFromCart = currentUuid => (
    ({ type: REMOVE_FROM_CART, currentUuid })
);


/* REDUX REDUCERS */
export const cartReducer = (state = {}, action = {}) => {
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
    }).catch(globals.parseAndLogError.bind('Update cart', 'putRequest'))
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


// Button to add the current object to the cart, or to remove it.
const CartControlComponent = ({ cart, currentUuid, onAddToCartClick, onRemoveFromCartClick }) => (
    cart.indexOf(currentUuid) > -1
        ? <button onClick={onRemoveFromCartClick}>Remove from Cart</button>
        : <button onClick={onAddToCartClick}>Add to Cart</button>
);

CartControlComponent.propTypes = {
    cart: PropTypes.array, // Current contents of cart
    currentUuid: PropTypes.string.isRequired, // UUID of current object being added
    onAddToCartClick: PropTypes.func.isRequired, // Function to call when Add to Cart clicked
    onRemoveFromCartClick: PropTypes.func.isRequired, // Function to call when Remove from Cart clicked
};

CartControlComponent.defaultProps = {
    cart: [],
};

const mapStateToProps = (state, ownProps) => ({ cart: state.cart, currentUuid: ownProps.current.uuid });
const mapDispatchToProps = (dispatch, ownProps) => (
    {
        onAddToCartClick: () => dispatch(addToCart(ownProps.current.uuid)),
        onRemoveFromCartClick: () => dispatch(removeFromCart(ownProps.current.uuid)),
    }
);

const CartControl = connect(mapStateToProps, mapDispatchToProps)(CartControlComponent);


export default CartControl;
