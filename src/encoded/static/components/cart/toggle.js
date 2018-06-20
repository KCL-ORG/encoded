// Components and functions to modify the cart.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { svgIcon } from '../../libs/svg-icons';
import { addToCart, removeFromCart } from './actions';


// Button to add the current object to the cart, or to remove it.
const CartToggleComponent = ({ cart, savedItems, current, onAddToCartClick, onRemoveFromCartClick }) => {
    const inCart = cart.indexOf(current) > -1;
    const saved = savedItems.indexOf(current) > -1;
    const onClick = inCart ? onRemoveFromCartClick : onAddToCartClick;

    return (
        <div className="cart__toggle">
            <div className={`cart__checkbox${inCart ? ' cart__checkbox--in-cart' : ''}`}>
                <button
                    onClick={onClick}
                    title={inCart ? 'Remove from cart' : 'Add to cart'}
                    aria-pressed={inCart}
                    aria-label={inCart ? `Remove ${saved ? 'saved' : 'unsaved'} item from cart` : `Add ${saved ? 'saved' : 'unsaved'} item to cart`}
                >
                    {svgIcon('cart')}
                </button>
            </div>
        </div>
    );
};

CartToggleComponent.propTypes = {
    cart: PropTypes.array, // Current contents of cart
    savedItems: PropTypes.array, // Items already saved to user cart
    current: PropTypes.string.isRequired, // @id of current object being added
    onAddToCartClick: PropTypes.func.isRequired, // Function to call when Add to Cart clicked
    onRemoveFromCartClick: PropTypes.func.isRequired, // Function to call when Remove from Cart clicked
};

CartToggleComponent.defaultProps = {
    cart: [],
    savedItems: [],
};

const mapStateToProps = (state, ownProps) => ({
    cart: state.cart,
    savedItems: (state.savedCartObj && state.savedCartObj.items) || [],
    current: ownProps.current['@id'],
});

const mapDispatchToProps = (dispatch, ownProps) => (
    {
        onAddToCartClick: () => dispatch(addToCart(ownProps.current['@id'])),
        onRemoveFromCartClick: () => dispatch(removeFromCart(ownProps.current['@id'])),
    }
);

const CartToggle = connect(mapStateToProps, mapDispatchToProps)(CartToggleComponent);

export default CartToggle;
