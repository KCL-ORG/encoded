// Cart-related rendering components exist in this file.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
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
const CartComponent = ({ context, cart }) => {
    // Combine in-memory and DB carts.
    const combinedCarts = (context.items && context.items.length > 0) ? context.items.concat(cart) : cart.slice();
    if (combinedCarts.length > 0) {
        const cartQueryString = combinedCarts.map(cartItem => `${encodedURIComponent('@id')}=${cartItem}`).join('&');
        return (
            <div className={itemClass(context, 'view-item')}>
                <header className="row">
                    <div className="col-sm-12">
                        <h2>Cart</h2>
                    </div>
                </header>
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

const mapStateToProps = state => ({ cart: state.cart });
const Cart = connect(mapStateToProps)(CartComponent);

// Respond to both the 'carts' object for /carts/ URI, and 'Cart' for /carts/<uuid> URI.
contentViews.register(Cart, 'carts');
contentViews.register(Cart, 'Cart');
