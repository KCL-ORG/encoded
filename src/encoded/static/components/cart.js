import React from 'react';
import PropTypes from 'prop-types';
import * as globals from './globals';


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
function updateCart(cart, cartAtId, fetch) {
    return fetch(cartAtId, {
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
}


/**
 * Get a writeable version of the cart object specified by `cartAtId`.
 *
 * @param {string} cartAtId - @id of the cart object to retrieve
 * @param {func} fetch - fetch function to use
 * @return {object} - Promise containing the retrieved cart object, or an error response
 */
function getWriteableCart(cartAtId, fetch) {
    return fetch(`${cartAtId}?frame=edit`, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    }).then((response) => {
        if (!response.ok) {
            throw response;
        }
        return response.json();
    }).catch(globals.parseAndLogError.bind('Get writeable cart', 'putRequest'));
}


// Render the Add to Cart button and react to clicks in it by updating the current cart object
// to include the UUID of the object given in `objToAdd`.
class CartAdd extends React.Component {
    constructor() {
        super();

        // Bind `this` to non-React methods.
        this.addAction = this.addAction.bind(this);
    }

    addAction() {
        const { cart, objToAdd } = this.props;

        // Adding the given object UUID to the current user's carts's `cart_items` array. Start by
        // getting the user's cart object with "frame=edit" to get a PUTable version of the object.
        getWriteableCart(cart['@id'], this.context.fetch).then((writeableCart) => {
            // Add the new UUID to the end of the `cart_items` array and then write it to the
            // db.
            writeableCart.cart_items.push(objToAdd.uuid);
            return updateCart(writeableCart, cart['@id'], this.context.fetch);
        });
    }

    render() {
        const { cart, objToAdd } = this.props;

        // Determine if the object in `objToAdd` is already in the current cart or not.
        const inCart = !!cart.cart_items.find(cartItem => cartItem === objToAdd.uuid);

        return (
            <button onClick={this.addAction} disabled={inCart}>{inCart ? 'In cart' : 'Add to cart'}</button>
        );
    }
}

CartAdd.propTypes = {
    cart: PropTypes.object.isRequired, // cart object for the current user
    objToAdd: PropTypes.object.isRequired, // Object to add to grouping; must have uuid property
};

CartAdd.contextTypes = {
    fetch: PropTypes.func,
};

export default CartAdd;
