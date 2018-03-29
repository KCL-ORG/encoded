import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';


// Button to add the current object to the cart, or to remove it.
const CartStatusComponent = ({ cart }) => (
    cart.length > 0 ?
        <ul className="nav navbar-nav">
            <li>
                <button>Cart {cart.length}</button>
            </li>
        </ul>
    : null
);

CartStatusComponent.propTypes = {
    cart: PropTypes.array, // Cart contents
};

CartStatusComponent.defaultProps = {
    cart: [],
};

const mapStateToProps = state => ({ cart: state.cart });

const CartStatus = connect(mapStateToProps)(CartStatusComponent);
export default CartStatus;
