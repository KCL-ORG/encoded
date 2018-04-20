// Components and functions to modify the cart.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { addToCart, removeFromCart } from './actions';


// Button to add the current object to the cart, or to remove it.
const CartToggleComponent = ({ cart, current, onAddToCartClick, onRemoveFromCartClick }) => {
    const checked = cart.indexOf(current) > -1;
    const onChange = checked ? onRemoveFromCartClick : onAddToCartClick;
    return <input type="checkbox" checked={cart.indexOf(current) > -1} onChange={onChange} />;
};

CartToggleComponent.propTypes = {
    cart: PropTypes.array, // Current contents of cart
    current: PropTypes.string.isRequired, // @id of current object being added
    onAddToCartClick: PropTypes.func.isRequired, // Function to call when Add to Cart clicked
    onRemoveFromCartClick: PropTypes.func.isRequired, // Function to call when Remove from Cart clicked
};

CartToggleComponent.defaultProps = {
    cart: [],
};

const mapStateToProps = (state, ownProps) => ({ cart: state.cart, current: ownProps.current['@id'] });
const mapDispatchToProps = (dispatch, ownProps) => (
    {
        onAddToCartClick: () => dispatch(addToCart(ownProps.current['@id'])),
        onRemoveFromCartClick: () => dispatch(removeFromCart(ownProps.current['@id'])),
    }
);

const CartToggle = connect(mapStateToProps, mapDispatchToProps)(CartToggleComponent);
export default CartToggle;
