// Components to display the status of the cart.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { DropdownMenu } from '../../libs/bootstrap/dropdown-menu';
import { Nav, NavItem } from '../../libs/bootstrap/navbar';
import { svgIcon } from '../../libs/svg-icons';
import CartShare from './cart_share';


const CartNavTitle = ({ cart }) => (
    <div className="cart__nav"><div className="cart__nav-icon">{svgIcon('cart')}</div> <div className="cart__nav-count">{cart.length}</div></div>
);

CartNavTitle.propTypes = {
    cart: PropTypes.array.isRequired, // Array of cart contents
};


// Button to add the current object to the cart, or to remove it.
class CartStatusComponent extends React.Component {
    constructor() {
        super();
        this.state = {
            shareModalOpen: false,
        };
        this.shareCartClick = this.shareCartClick.bind(this);
        this.closeShareCart = this.closeShareCart.bind(this);
    }

    shareCartClick() {
        this.setState({ shareModalOpen: true });
    }

    closeShareCart() {
        this.setState({ shareModalOpen: false });
    }

    render() {
        const { cart, openDropdown, dropdownClick } = this.props;
        const loggedIn = !!(this.context.session && this.context.session['auth.userid']);
        const userCart = (loggedIn && this.context.session_properties && this.context.session_properties.user) ? this.context.session_properties.user.carts[0] : null;

        // Define the menu items for the Cart Status menu.
        const menuItems = [<a key="view" href="/carts/">View cart</a>];
        if (loggedIn) {
            menuItems.push(<button key="share" onClick={this.shareCartClick}>Share cart</button>);
        }

        return (
            cart.length > 0 ?
                <Nav>
                    <NavItem dropdownId="cart-control" dropdownTitle={<CartNavTitle cart={cart} />} openDropdown={openDropdown} dropdownClick={dropdownClick}>
                        <DropdownMenu label="cart-control">
                            {menuItems}
                        </DropdownMenu>
                    </NavItem>
                    {this.state.shareModalOpen ? <CartShare userCart={userCart} closeShareCart={this.closeShareCart} /> : null}
                </Nav>
            : null
        );
    }
}

CartStatusComponent.propTypes = {
    cart: PropTypes.array, // Cart contents
    openDropdown: PropTypes.string.isRequired, // ID of the dropdown currently visible
    dropdownClick: PropTypes.func.isRequired, // Function to call when dropdown clicked
};

CartStatusComponent.defaultProps = {
    cart: [],
};

CartStatusComponent.contextTypes = {
    session: PropTypes.object, // Login information
    session_properties: PropTypes.object, // Logged-in user information
};


const mapStateToProps = (state, ownProps) => ({
    cart: state.cart,
    openDropdown: ownProps.openDropdown,
    dropdownClick: ownProps.dropdownClick,
});

const CartStatus = connect(mapStateToProps)(CartStatusComponent);
export default CartStatus;
