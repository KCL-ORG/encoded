// Components for rendering the /carts/ page.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'underscore';
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
const CartComponent = ({ context, cart, session, sessionProperties }) => {
    // Combine in-memory and DB carts. We can have in-memory carts with different contents from
    // the DB cart, so have to consider both.
    if ((context.items && context.items.length) > 0 || cart.length > 0) {
        const combinedCarts = _.uniq(cart.concat(context.items));
        const cartQueryString = combinedCarts.map(cartItem => `${encodedURIComponent('@id')}=${encodedURIComponent(cartItem)}`).join('&');
        const loggedIn = !!(session && session['auth.userid']);
        const userCart = (loggedIn && sessionProperties && sessionProperties.user) ? sessionProperties.user.carts[0] : null;

        return (
            <div className={itemClass(context, 'view-item')}>
                <header className="row">
                    <div className="col-sm-12">
                        <h2>Cart</h2>
                    </div>
                </header>
                {loggedIn ? <CartSave /> : null}
                {userCart ? <CartShare userCart={userCart} /> : null}
                <FetchedData>
                    <Param name="results" url={`/search/?type=Experiment&${cartQueryString}`} />
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
    session: PropTypes.object, // App session object
    sessionProperties: PropTypes.object,
};

CartComponent.defaultProps = {
    session: null,
    sessionProperties: null,
};

const mapStateToProps = (state, ownProps) => ({
    cart: state.cart,
    session: ownProps.session,
    sessionProperties: ownProps.sessionProperties,
});
const CartInternal = connect(mapStateToProps)(CartComponent);


// Called when a "Cart" object is requested to be rendered. This is a standard React component
// that's sort of a wrapper around <CartInternal> which is a Redux component. This lets us pass the
// encoded context properties as regular props to <CartIntenral>.
const Cart = (props, reactContext) => (
    <CartInternal context={props.context} session={reactContext.session} sessionProperties={reactContext.session_properties} />
);

Cart.propTypes = {
    context: PropTypes.object.isRequired, // Cart object to render
};

Cart.contextTypes = {
    session: PropTypes.object,
    session_properties: PropTypes.object,
};

// Respond to both the 'carts' object for /carts/ URI, and 'Cart' for /carts/<uuid> URI.
contentViews.register(Cart, 'carts');
contentViews.register(Cart, 'Cart');
