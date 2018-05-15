// Components to display the status of the cart.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { DropdownMenu } from '../../libs/bootstrap/dropdown-menu';
import { Nav, NavItem } from '../../libs/bootstrap/navbar';
import { svgIcon } from '../../libs/svg-icons';


const CartNavTitle = ({ cart }) => (
    <div className="cart__nav"><div className="cart__nav-icon">{svgIcon('cart')}</div> <div className="cart__nav-count">{cart.length}</div></div>
);

CartNavTitle.propTypes = {
    cart: PropTypes.array.isRequired, // Array of cart contents
};


// Button to add the current object to the cart, or to remove it.
const CartStatusComponent = ({ cart, openDropdown, dropdownClick }) => (
    cart.length > 0 ?
        <Nav>
            <NavItem dropdownId="cart-control" dropdownTitle={<CartNavTitle cart={cart} />} openDropdown={openDropdown} dropdownClick={dropdownClick}>
                <DropdownMenu label="cart-control">
                    {[<a key="view" href="/carts/">View cart</a>]}
                </DropdownMenu>
            </NavItem>
        </Nav>
    : null
);

CartStatusComponent.propTypes = {
    cart: PropTypes.array, // Cart contents
    openDropdown: PropTypes.string.isRequired, // ID of the dropdown currently visible
    dropdownClick: PropTypes.func.isRequired, // Function to call when dropdown clicked
};

CartStatusComponent.defaultProps = {
    cart: [],
};

const mapStateToProps = (state, ownProps) => ({
    cart: state.cart,
    openDropdown: ownProps.openDropdown,
    dropdownClick: ownProps.dropdownClick,
 });

const CartStatus = connect(mapStateToProps)(CartStatusComponent);
export default CartStatus;
