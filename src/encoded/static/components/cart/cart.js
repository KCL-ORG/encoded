// Components for rendering the /carts/ page.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'underscore';
import { Panel, PanelHeading, PanelBody } from '../../libs/bootstrap/panel';
import CartSave from './save';
import { getSavedCart } from './util';
import { contentViews, itemClass, encodedURIComponent } from '../globals';
import { requestSearch } from '../objectutils';
import { ResultTableList } from '../search';


// Called from <FetcheData> to render search results for all items in the current cart.
const CartSearchResults = ({ results, activeCart }) => (
    <ResultTableList results={results['@graph']} columns={results.columns} activeCart={activeCart} />
);

CartSearchResults.propTypes = {
    results: PropTypes.object, // Array of cart item objects from search
    activeCart: PropTypes.bool, // True if displaying an active cart
};

CartSearchResults.defaultProps = {
    results: {},
    activeCart: false,
};


// Renders the cart search results page. Display either:
// 1. Shared cart (/carts/<uuid>) containing user's saved items
// 2. Active cart (/carts/) containing saved and in-memory items
// Also note the "saved cart" which comes from the user object's `carts` object that contains saved
// items even when viewing the active cart.
class CartComponent extends React.Component {
    constructor() {
        super();
        this.state = {
            cartSearchResults: {},
        };
        this.renderCartObjects = this.renderCartObjects.bind(this);
    }

    componentDidMount() {
        // The cart only has object @ids, so first thing is to get search results for each of them.
        this.renderCartObjects();
    }

    componentDidUpdate(prevProps, prevState) {
        // Start by seeing if we got a response to our GET request.
        const prevSearchItems = prevState.cartSearchResults['@graph'] || [];
        const currSearchItems = this.state.cartSearchResults['@graph'] || [];
        if (prevSearchItems.length !== currSearchItems.length) {
            return;
        }

        // Start by getting the sharable cart objects and the saved cart objects.
        const prevSharedCart = prevProps.context.items || [];
        const currentSharedCart = this.props.context.items || [];
        const prevSavedCart = getSavedCart(prevProps.sessionProperties);
        const currentSavedCart = getSavedCart(this.props.sessionProperties);

        // Redraw if the in-memory, shared, or saved cart lengths have changed.
        if ((prevProps.cart.length !== this.props.cart.length) ||
            (prevSharedCart.length !== currentSharedCart.length) ||
            (prevSavedCart.length !== currentSavedCart.length)) {
            this.renderCartObjects();
            return;
        }

        // Redraw if login cookie information changed.
        if (!_.isEqual(this.props.session, prevProps.session)) {
            this.renderCartObjects();
            return;
        }

        // Redraw if the in-memory, shared, or saved cart contents have changed.
        if (!_.isEqual(prevProps.cart, this.props.cart) ||
            !_.isEqual(prevSharedCart, currentSharedCart) ||
            !_.isEqual(prevSavedCart, currentSavedCart)) {
            this.renderCartObjects();
        }
    }

    renderCartObjects() {
        const { context, cart, sessionProperties } = this.props;
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
        requestSearch(cartQueryString).then((searchResults) => {
            this.setState({ cartSearchResults: searchResults });
        });
    }

    render() {
        const { context, session } = this.props;
        const loggedIn = !!(session && session['auth.userid']);

        // Shared and active carts displayed slightly differently.
        const activeCart = context['@type'][0] === 'carts';

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
                        {Object.keys(this.state.cartSearchResults).length > 0 ?
                            <CartSearchResults results={this.state.cartSearchResults} activeCart={activeCart} />
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
