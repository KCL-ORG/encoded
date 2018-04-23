// Components and functions to modify the cart.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { removeMultipleFromCart } from './actions';


// Button to add the current object to the cart, or to remove it.
const CartRemoveMultipleComponent = ({ cart, items, onClick }) => {
    const disabled = items.every(item => cart.indexOf(item['@id']) === -1);
    return <button disabled={disabled} onClick={onClick}>Remove all</button>;
};

CartRemoveMultipleComponent.propTypes = {
    cart: PropTypes.array, // Current contents of cart
    items: PropTypes.array.isRequired, // List of @ids of the items to add
    onClick: PropTypes.func.isRequired, // Function to call when Add to Cart clicked
};

CartRemoveMultipleComponent.defaultProps = {
    cart: [],
};

const mapStateToProps = (state, ownProps) => ({ cart: state.cart, items: ownProps.items });
const mapDispatchToProps = (dispatch, ownProps) => (
    {
        onClick: () => {
            const itemAtIds = ownProps.items.map(item => item['@id']);
            return dispatch(removeMultipleFromCart(itemAtIds));
        },
    }
);

const CartRemoveMultiple = connect(mapStateToProps, mapDispatchToProps)(CartRemoveMultipleComponent);
export default CartRemoveMultiple;
