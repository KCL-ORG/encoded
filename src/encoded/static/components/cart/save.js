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
 * @param {func} fetch - system-wide fetch operation
 * @return {object} - Promise containing array of carts for logged-in user
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
    }).then(result => (
        result['@graph']
    )).catch(parseAndLogError.bind('Update cart', 'putRequest'))
);


/**
 * Get a writeable version of the cart object specified by `cartAtId`.
 *
 * @param {string} cartAtId - @id of the cart object to retrieve
 * @param {func} fetch - system-wide fetch operation
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
 * Create a new object in the DB for the given cart object and user.
 *
 * @param {object} cart - current cart object to be saved
 * @param {object} user - current logged-in user's object
 * @param {func} fetch - system-wide fetch operation
 */
const createCartObject = (cart, user, fetch) => {
    const writeableCart = {
        name: `${user.title} cart`,
        items: cart,
        submitted_by: user['@id'],
        status: 'current',
    };
    return fetch('/cart/', {
        method: 'POST',
        body: JSON.stringify(writeableCart),
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    }).then(result => result['@graph']);
};


/**
 * Save the in-memory cart to the database.
 *
 * @param {array} cart - Array of @ids contained with the in-memory cart to be saved
 * @param {string} cartAtId - @id of the cart to update
 * @param {func} fetch - System fetch function; usually from <App> context
 */
const saveCart = (cart, user, fetch) => {
    const cartAtId = (user.carts.length > 0) ? user.carts[0]['@id'] : null;
    if (cartAtId) {
        return getWriteableCartObject(cartAtId, fetch).then((writeableCart) => {
            // Copy the in-memory cart to the writeable cart object and then update it in the DB.
            writeableCart.items = cart;
            return updateCartObject(writeableCart, cartAtId, fetch);
        });
    }

    // No user cart. Make one from scratch and save it.
    return createCartObject(cart, user, fetch);
};


// Renders and reacts to the button to save a cart to the DB.
class CartSaveComponent extends React.Component {
    constructor() {
        super();
        this.saveCartClick = this.saveCartClick.bind(this);
    }

    saveCartClick() {
        this.props.onSaveCartClick(this.props.cart, this.props.user, this.props.fetch).then(() => {
            this.props.fetchSessionProperties();
        });
    }

    render() {
        return <button className="btn btn-info btn-sm cart__save-button" onClick={this.saveCartClick}>Save cart</button>;
    }
}

CartSaveComponent.propTypes = {
    cart: PropTypes.array.isRequired, // In-memory cart from redux store
    user: PropTypes.object, // Logged-in user object
    onSaveCartClick: PropTypes.func.isRequired, // Function to call when "Save cart" clicked
    fetch: PropTypes.func.isRequired, // fetch function from App context
    fetchSessionProperties: PropTypes.func.isRequired, // fetchSessionProperties function from App context
};

CartSaveComponent.defaultProps = {
    user: null,
};

const mapStateToProps = (state, ownProps) => ({
    cart: state.cart,
    user: ownProps.sessionProperties.user,
    fetch: ownProps.fetch,
    fetchSessionProperties: ownProps.fetchSessionProperties,
});
const mapDispatchToProps = () => (
    { onSaveCartClick: (cart, user, fetch) => saveCart(cart, user, fetch) }
);

const CartSaveInternal = connect(mapStateToProps, mapDispatchToProps)(CartSaveComponent);


const CartSave = (props, reactContext) => (
    <CartSaveInternal sessionProperties={reactContext.session_properties} fetch={reactContext.fetch} fetchSessionProperties={reactContext.fetchSessionProperties} />
);

CartSave.contextTypes = {
    session_properties: PropTypes.object.isRequired,
    fetch: PropTypes.func.isRequired,
    fetchSessionProperties: PropTypes.func.isRequired,
};

export default CartSave;

