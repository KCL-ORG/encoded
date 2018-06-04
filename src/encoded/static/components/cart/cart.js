// Components for rendering the /carts/ page.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'underscore';
import { Panel, PanelHeading, PanelBody } from '../../libs/bootstrap/panel';
import CartSave from './save';
import { getSavedCart } from './util';
import { FetchedData, Param } from '../fetched';
import { contentViews, itemClass, encodedURIComponent } from '../globals';
import { ResultTableList } from '../search';


// Called from <FetcheData> to render search results for all items in the current cart.
const CartSearchResults = ({ results, activeCart }) => (
    <ResultTableList results={results['@graph']} columns={results.columns} activeCart={activeCart} />
);

CartSearchResults.propTypes = {
    results: PropTypes.object, // encode search results
    activeCart: PropTypes.bool, // True if displaying an active cart
};

CartSearchResults.defaultProps = {
    results: null,
    activeCart: false,
};


// Renders the cart search results page. Display either:
// 1. Shared cart (/carts/<uuid>) containing user's saved items
// 2. Active cart (/carts/) containing saved and in-memory items
// Also note the "saved cart" which comes from the user object's `carts` object that contains saved
// items even when viewing the active cart.
class CartComponent extends React.Component {
    // Each render does a GET request, so we need to avoid them if possible.
    shouldComponentUpdate(nextProps) {
        // Start by getting the sharable cart objects and the saved cart objects.
        const nextSharedCart = nextProps.context.items || [];
        const currentSharedCart = this.props.context.items || [];
        const nextSavedCart = getSavedCart(nextProps.sessionProperties);
        const currentSavedCart = getSavedCart(this.props.sessionProperties);

        // Redraw if the in-memory, shared, or saved cart lengths have changed.
        if ((nextProps.cart.length !== this.props.cart.length) ||
            (nextSharedCart.length !== currentSharedCart.length) ||
            (nextSavedCart.length !== currentSavedCart.length)) {
            return true;
        }

        // Redraw if login cookie information changed.
        if (!_.isEqual(this.props.session, nextProps.session)) {
            return true;
        }

        // Redraw if the in-memory, shared, or saved cart contents have changed.
        return (
            !_.isEqual(nextProps.cart, this.props.cart) ||
            !_.isEqual(nextSharedCart, currentSharedCart) ||
            !_.isEqual(nextSavedCart, currentSavedCart)
        );
    }

    render() {
        const { context, cart, session, sessionProperties } = this.props;
        const loggedIn = !!(session && session['auth.userid']);
        let cartItems = [];

        // Shared and active carts displayed slightly differently.
        const activeCart = context['@type'][0] === 'carts';

        // Retrieve active or shared cart item uuids and build a search query string out of them.
        if (activeCart) {
            // Combine in-memory and saved carts.
            cartItems = _.uniq(cart.concat(getSavedCart(sessionProperties)));
        } else {
            cartItems = context.items || [];
        }
        const cartQueryString = cartItems.length > 0 ? cartItems.map(cartItem => `${encodedURIComponent('@id')}=${encodedURIComponent(cartItem)}`).join('&') : '';

        return (
            <div className={itemClass(context, 'view-item')}>
                <header className="row">
                    <div className="col-sm-12">
                        <h2>Cart</h2>
                    </div>
                </header>
                <Panel>
                    {activeCart ?
                        <PanelHeading addClasses="cart__heading">
                            <div className="cart__loss-warning">
                                Any unsaved changes to the cart are lost if you reload any page.
                            </div>
                            {loggedIn ? <CartSave /> : null}
                        </PanelHeading>
                    : null}
                    <PanelBody addClasses="cart__result-table">
                        {cartQueryString ?
                            <div>
                                <FetchedData>
                                    <Param name="results" url={`/search/?type=Experiment&${cartQueryString}`} />
                                    <CartSearchResults activeCart={activeCart} />
                                </FetchedData>
                            </div>
                        :
                            <p className="cart__empty-message">
                                Empty cart
                            </p>
                        }
                    </PanelBody>
                </Panel>
            </div>
        );
    }
}

CartComponent.propTypes = {
    context: PropTypes.object.isRequired, // Cart object to display
    cart: PropTypes.array.isRequired, // In-memory cart contents
    session: PropTypes.object, // App session info
    sessionProperties: PropTypes.object, // Session login info, including saved cart
};

CartComponent.defaultProps = {
    session: null,
    sessionProperties: null,
};

const mapStateToProps = (state, ownProps) => ({
    cart: state.cart,
    session: ownProps.session,
});
const CartInternal = connect(mapStateToProps)(CartComponent);


// Called when a "Cart" object is requested to be rendered. This is a standard React component
// that's sort of a wrapper around <CartInternal> which is a Redux component. This lets us pass the
// encoded context properties as regular props to <CartIntenral>. Passing React context directly to
// a Redux component doesn't seem very reliable.
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

contentViews.register(Cart, 'carts'); // /carts/ URI
contentViews.register(Cart, 'Cart'); // /carts/<uuid> URI
