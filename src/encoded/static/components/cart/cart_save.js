import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { parseAndLogError } from '../globals';


/**
 * Update the cart object in the DB. You must provide `cartAtId` because `cart` cannot have non-
 * writeable properties in it, and @id is one of several non-writeable properites. You normally
 * get an object with no non-writeable properties by doing a GET request on that object with
 * "frame=edit" in the query string.
 *
 * @param {object} cart - cart object to update; must be editable version (no @id etc)
 * @param {string} cartAtId - @id of the cart object to update
 * @param {func} fetch - fetch function to use
 * @return (object) - Promise containing PUT response that resolves when request completes
 */
const updateCartObject = (cart, cartAtId, fetch) => (
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
    }).catch(parseAndLogError.bind('Update cart', 'putRequest'))
);


/**
 * Get a writeable version of the cart object specified by `cartAtId`.
 *
 * @param {string} cartAtId - @id of the cart object to retrieve
 * @param {func} fetch - fetch function to use
 * @return {object} - Promise containing the retrieved cart object, or an error response
 */
const getWriteableCartObject = (cartAtId, fetch) => (
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
    }).catch(parseAndLogError.bind('Get writeable cart', 'getRequest'))
);


/**
 * Save the in-memory cart to the database.
 *
 * @param {array} cart - Array of @ids contained with the in-memory cart to be saved
 * @param {*} cartAtId - @id of the cart to update
 * @param {*} fetch - System fetch function; usually from <App> context
 */
const saveCart = (cart, cartAtId, fetch) => {
    getWriteableCartObject(cartAtId, fetch).then((writeableCart) => {
        // Copy the in-memory cart to the writeable cart object and then update it in the DB.
        writeableCart.items = cart;
        return updateCartObject(writeableCart, cartAtId, fetch);
    });
};


// Renders and reacts to the button to save a cart to the DB.
class CartSaveComponent extends React.Component {
    constructor() {
        super();
        this.saveCartClick = this.saveCartClick.bind(this);
    }

    saveCartClick() {
        this.props.onSaveCartClick(this.props.cart, this.props.userCart['@id'], this.context.fetch);
    }

    render() {
        return <button onClick={this.saveCartClick}>Save cart</button>;
    }
}

CartSaveComponent.propTypes = {
    cart: PropTypes.array.isRequired, // In-memory cart from redux store
    userCart: PropTypes.object.isRequired, // @id of the cart to write to the DB
    onSaveCartClick: PropTypes.func.isRequired, // Function to call when "Save cart" clicked.
};

CartSaveComponent.contextTypes = {
    fetch: PropTypes.func,
};

const mapStateToProps = (state, ownProps) => ({
    cart: state.cart,
    userCart: ownProps.userCart,
});
const mapDispatchToProps = () => (
    { onSaveCartClick: (cart, cartAtId, fetch) => saveCart(cart, cartAtId, fetch) }
);

const CartSave = connect(mapStateToProps, mapDispatchToProps)(CartSaveComponent);
export default CartSave;

