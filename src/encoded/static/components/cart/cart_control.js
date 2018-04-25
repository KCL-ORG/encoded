// Components and functions to modify the cart.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { addToCart, addMultipleToCart, removeFromCart } from './actions';


// Button to add the current object to the cart, or to remove it.
const CartControlComponent = ({ cart, current, onAddToCartClick, onRemoveFromCartClick }) => (
    cart.indexOf(current) > -1
        ? <button className="btn btn-info" onClick={onRemoveFromCartClick}>Remove from Cart</button>
        : <button className="btn btn-info" onClick={onAddToCartClick}>Add to Cart</button>
);

CartControlComponent.propTypes = {
    cart: PropTypes.array, // Current contents of cart
    current: PropTypes.string.isRequired, // @id of current object being added
    onAddToCartClick: PropTypes.func.isRequired, // Function to call when Add to Cart clicked
    onRemoveFromCartClick: PropTypes.func.isRequired, // Function to call when Remove from Cart clicked
};

CartControlComponent.defaultProps = {
    cart: [],
};

const mapStateToProps = (state, ownProps) => ({ cart: state.cart, current: ownProps.current['@id'] });
const mapDispatchToProps = (dispatch, ownProps) => (
    {
        onAddToCartClick: () => dispatch(addToCart(ownProps.current['@id'])),
        onRemoveFromCartClick: () => dispatch(removeFromCart(ownProps.current['@id'])),
    }
);

const CartControl = connect(mapStateToProps, mapDispatchToProps)(CartControlComponent);
export default CartControl;


/**
 * Add encode item @ids to the store.
 *
 * @param {array} items - Array of @ids to add to the cart
 * @param {func} dispatch - Redux dispatch function for the cart store
 */
const cartAddItems = (items, dispatch) => {
    dispatch(addMultipleToCart(items));
};

export { cartAddItems };
