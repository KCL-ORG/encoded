import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FetchedData, Param } from '../fetched';
import { contentViews, itemClass, encodedURIComponent } from '../globals';
import { Search } from '../search';


const CartSearchResults = ({ results }) => (
    <Search context={results} />
);

CartSearchResults.propTypes = {
    results: PropTypes.object, // encode search results
};

CartSearchResults.defaultProps = {
    results: null,
};


const CartComponent = ({ context, cart }) => {
    if (cart.length > 0) {
        const cartQueryString = cart.map(cartItem => `${encodedURIComponent('@id')}=${cartItem}`).join('&');
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
contentViews.register(Cart, 'carts');

