// Components and functions to modify the cart.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { addMultipleToCart } from './actions';
import { filterAllowedItems } from './util';


// Button to add the current object to the cart, or to remove it.
const CartAddMultipleComponent = ({ cart, items, onClick }) => {
    const allowedItems = filterAllowedItems(items);
    const disabled = allowedItems.every(item => cart.indexOf(item['@id']) > -1);
    return <button className="btn btn-info btn-sm" disabled={disabled} onClick={onClick}>Add all</button>;
};

CartAddMultipleComponent.propTypes = {
    cart: PropTypes.array, // Current contents of cart
    items: PropTypes.array.isRequired, // List of @ids of the items to add
    onClick: PropTypes.func.isRequired, // Function to call when Add to Cart clicked
};

CartAddMultipleComponent.defaultProps = {
    cart: [],
};

const mapStateToProps = (state, ownProps) => ({ cart: state.cart, items: ownProps.items });
const mapDispatchToProps = (dispatch, ownProps) => (
    {
        onClick: () => {
            const itemAtIds = filterAllowedItems(ownProps.items).map(item => item['@id']);
            return dispatch(addMultipleToCart(itemAtIds));
        },
    }
);

const CartAddMultiple = connect(mapStateToProps, mapDispatchToProps)(CartAddMultipleComponent);
export default CartAddMultiple;
