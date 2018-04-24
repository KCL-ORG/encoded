// Components for rendering the /carts/ page.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import CartSave from './cart_save';
import CartShare from './cart_share';
import { FetchedData, Param } from '../fetched';
import { contentViews, itemClass, encodedURIComponent } from '../globals';
import { Search } from '../search';


// Called from <FetcheData> to render search results for all items in the current cart.
const CartSearchResults = ({ results }) => (
    <Search context={results} />
);

CartSearchResults.propTypes = {
    results: PropTypes.object, // encode search results
};

CartSearchResults.defaultProps = {
    results: null,
};


// Renders the cart search results page.
const CartComponent = ({ context, cart }, reactContext) => {
    // Combine in-memory and DB carts.
    if (cart.length > 0) {
        const cartQueryString = cart.map(cartItem => `${encodedURIComponent('@id')}=${cartItem}`).join('&');
        const loggedIn = !!(reactContext.session && reactContext.session['auth.userid']);
        const userCart = (loggedIn && reactContext.session_properties && reactContext.session_properties.user && reactContext.session_properties.user.carts.length > 0)
            ? reactContext.session_properties.user.carts[0]
            : null;
        return (
            <div className={itemClass(context, 'view-item')}>
                <header className="row">
                    <div className="col-sm-12">
                        <h2>Cart</h2>
                    </div>
                </header>
                {loggedIn ?
                    <div>
                        <CartSave userCart={userCart} />
                        <CartShare userCart={userCart} />
                    </div>
                : null}
                <FetchedData>
                    <Param name="results" url={`/search/?${cartQueryString}`} />
                    <CartSearchResults />
                </FetchedData>
            </div>
        );
    }
    return null;
};

CartComponent.propTypes = {
    context: PropTypes.object.isRequired, // Cart object to display
    cart: PropTypes.array.isRequired, // In-memory cart contents
};

CartComponent.contextTypes = {
    session: PropTypes.object,
    session_properties: PropTypes.object,
};

const mapStateToProps = state => ({ cart: state.cart });
const Cart = connect(mapStateToProps)(CartComponent);

// Respond to both the 'carts' object for /carts/ URI, and 'Cart' for /carts/<uuid> URI.
contentViews.register(Cart, 'carts');
contentViews.register(Cart, 'Cart');
